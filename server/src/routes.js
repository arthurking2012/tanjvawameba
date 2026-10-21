import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import {
  getAllFiles,
  getFileById,
  createFile,
  incrementDownloads,
  deleteFileRecord,
  getStats
} from './db.js';
import {
  UPLOADS_DIR,
  saveFileToStorage,
  streamFileToResponse,
  deleteFileFromStorage,
  isSupabaseEnabled
} from './storage.js';

const router = express.Router();

// Helper to determine file category
export function getCategoryFromMime(mimeType, filename) {
  const ext = (path.extname(filename || '') || '').toLowerCase();
  
  if (mimeType?.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(ext)) {
    return 'image';
  }
  if (mimeType?.startsWith('video/') || ['.mp4', '.mkv', '.mov', '.avi', '.webm', '.flv', '.wmv'].includes(ext)) {
    return 'video';
  }
  if (mimeType?.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(ext)) {
    return 'audio';
  }
  if (
    mimeType?.includes('pdf') ||
    mimeType?.includes('word') ||
    mimeType?.includes('document') ||
    mimeType?.includes('text') ||
    mimeType?.includes('sheet') ||
    mimeType?.includes('presentation') ||
    ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.xls', '.xlsx', '.ppt', '.pptx', '.csv', '.md'].includes(ext)
  ) {
    return 'document';
  }
  if (
    mimeType?.includes('zip') ||
    mimeType?.includes('compressed') ||
    mimeType?.includes('tar') ||
    ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso'].includes(ext)
  ) {
    return 'archive';
  }
  return 'other';
}

// Multer disk storage setup
const maxFileSizeMb = parseInt(process.env.MAX_FILE_SIZE_MB || '20480', 10);
const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const fileId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes
  }
});

/**
 * Public configuration endpoint
 */
router.get('/config', (req, res) => {
  res.json({
    maxFileSizeMb,
    storageType: isSupabaseEnabled() ? 'supabase' : 'local',
    allowedCategories: ['image', 'video', 'audio', 'document', 'archive', 'other']
  });
});

/**
 * Upload single or multiple files
 */
router.post('/upload', (req, res) => {
  const uploadMiddleware = upload.array('files', 10);

  uploadMiddleware(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: `ფაილის ზომა აღემატება დასაშვებ ლიმიტს (${maxFileSizeMb} MB).`
        });
      }
      return res.status(400).json({ error: `ატვირთვის შეცდომა: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: `სერვერის შეცდომა: ${err.message}` });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'გთხოვთ აირჩიოთ ასატვირთი ფაილი.' });
    }

    try {
      const results = [];

      for (const file of req.files) {
        // Unique safe 12-char public ID for sharing
        const id = crypto.randomBytes(6).toString('hex');
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const category = getCategoryFromMime(file.mimetype, originalName);

        // Save to selected storage (local or supabase)
        const storageDetails = await saveFileToStorage(file, id);

        const record = {
          id,
          originalName,
          filename: file.filename,
          size: file.size,
          mimeType: file.mimetype || 'application/octet-stream',
          category,
          downloadsCount: 0,
          createdAt: new Date().toISOString(),
          ...storageDetails
        };

        createFile(record);
        results.push(record);
      }

      res.status(201).json({
        success: true,
        files: results
      });
    } catch (uploadErr) {
      console.error('Error during upload processing:', uploadErr);
      res.status(500).json({ error: 'ფაილის დამუშავების შეცდომა.' });
    }
  });
});

/**
 * List all files with optional search & category filter
 */
router.get('/files', (req, res) => {
  const { search, category, sort } = req.query;
  let files = getAllFiles();

  // Search filter
  if (search && typeof search === 'string') {
    const term = search.toLowerCase();
    files = files.filter(f => f.originalName?.toLowerCase().includes(term));
  }

  // Category filter
  if (category && category !== 'all') {
    files = files.filter(f => f.category === category);
  }

  // Sorting
  if (sort === 'size_desc') {
    files.sort((a, b) => b.size - a.size);
  } else if (sort === 'size_asc') {
    files.sort((a, b) => a.size - b.size);
  } else if (sort === 'downloads') {
    files.sort((a, b) => (b.downloadsCount || 0) - (a.downloadsCount || 0));
  } else if (sort === 'name') {
    files.sort((a, b) => a.originalName.localeCompare(b.originalName));
  } else {
    // Default newest first
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ files });
});

/**
 * Get aggregate statistics
 */
router.get('/stats', (req, res) => {
  const stats = getStats();
  res.json(stats);
});

/**
 * Get metadata for a single file (Public share view)
 */
router.get('/files/:id', (req, res) => {
  const file = getFileById(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'ფაილი ვერ მოიძებნა ან წაშლილია.' });
  }

  // Return public metadata (exclude internal server paths)
  res.json({
    id: file.id,
    originalName: file.originalName,
    size: file.size,
    mimeType: file.mimeType,
    category: file.category,
    downloadsCount: file.downloadsCount,
    createdAt: file.createdAt
  });
});

/**
 * Download file directly (Public endpoint, increments download count)
 */
router.get('/files/:id/download', async (req, res) => {
  const file = getFileById(req.params.id);
  if (!file) {
    return res.status(404).send('ფაილი ვერ მოიძებნა ან ვადაგასულია.');
  }

  // Increment download counter
  incrementDownloads(file.id);

  // Stream file with safe headers
  await streamFileToResponse(file, res);
});

/**
 * Delete a file
 */
router.delete('/files/:id', async (req, res) => {
  const file = getFileById(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'ფაილი ვერ მოიძებნა.' });
  }

  // Remove physical file from storage
  await deleteFileFromStorage(file);

  // Remove record from DB
  deleteFileRecord(file.id);

  res.json({ success: true, message: 'ფაილი წარმატებით წაიშალა.' });
});

export default router;
