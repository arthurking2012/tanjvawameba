import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Optional Supabase client initialization
let supabase = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET || 'files';

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Storage] Supabase client initialized. Bucket:', supabaseBucket);
  } catch (err) {
    console.warn('[Storage] Failed to initialize Supabase client:', err.message);
  }
}

/**
 * Check if Supabase storage is actively configured
 */
export function isSupabaseEnabled() {
  return Boolean(supabase && process.env.STORAGE_TYPE === 'supabase');
}

/**
 * Save an uploaded file to storage (local disk or Supabase)
 * @param {Object} file - Multer file object
 * @param {string} fileId - Unique file ID
 * @returns {Promise<Object>} storage details
 */
export async function saveFileToStorage(file, fileId) {
  // If Supabase is configured and selected
  if (isSupabaseEnabled()) {
    try {
      const extension = path.extname(file.originalname);
      const storageKey = `${fileId}${extension}`;
      const fileBuffer = fs.readFileSync(file.path);

      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .upload(storageKey, fileBuffer, {
          contentType: file.mimetype || 'application/octet-stream',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Remove temp local file created by multer
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Get public URL if bucket is public
      const { data: publicData } = supabase.storage
        .from(supabaseBucket)
        .getPublicUrl(storageKey);

      return {
        storageType: 'supabase',
        storagePath: storageKey,
        supabasePublicUrl: publicData?.publicUrl || null
      };
    } catch (err) {
      console.error('[Storage] Supabase upload failed, falling back to local:', err.message);
      // Fallback: keep multer's local file
    }
  }

  // Local storage
  return {
    storageType: 'local',
    storagePath: path.basename(file.path),
    supabasePublicUrl: null
  };
}

/**
 * Handle streaming download of file to HTTP response
 */
export async function streamFileToResponse(fileRecord, res) {
  const originalName = fileRecord.originalName || 'downloaded-file';
  // ASCII fallback for Content-Disposition, plus RFC 5987 UTF-8 encoding for full international characters
  const asciiFallback = originalName.replace(/[^\x20-\x7E]/g, '_');
  const encodedName = encodeURIComponent(originalName);

  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`
  );
  res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
  res.setHeader('Content-Length', fileRecord.size);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (fileRecord.storageType === 'supabase' && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .download(fileRecord.storagePath);

      if (error || !data) {
        throw error || new Error('File not found in Supabase bucket');
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      return res.end(buffer);
    } catch (err) {
      console.error('[Storage] Supabase download failed:', err.message);
      return res.status(500).json({ error: 'ფაილის ჩამოტვირთვა ვერ მოხერხდა საცავიდან.' });
    }
  }

  // Local file streaming
  const localFilePath = path.join(UPLOADS_DIR, fileRecord.storagePath);
  if (!fs.existsSync(localFilePath)) {
    return res.status(404).json({ error: 'ფაილი ვერ მოიძებნა სერვერზე.' });
  }

  const stream = fs.createReadStream(localFilePath);
  stream.on('error', (err) => {
    console.error('[Storage] File streaming error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'ფაილის წაკითხვის შეცდომა.' });
    }
  });
  stream.pipe(res);
}

/**
 * Delete file from storage
 */
export async function deleteFileFromStorage(fileRecord) {
  if (fileRecord.storageType === 'supabase' && supabase) {
    try {
      await supabase.storage
        .from(supabaseBucket)
        .remove([fileRecord.storagePath]);
      return true;
    } catch (err) {
      console.error('[Storage] Supabase deletion failed:', err.message);
    }
  }

  // Delete local file
  const localFilePath = path.join(UPLOADS_DIR, fileRecord.storagePath);
  if (fs.existsSync(localFilePath)) {
    try {
      fs.unlinkSync(localFilePath);
      return true;
    } catch (err) {
      console.error('[Storage] Local deletion failed:', err.message);
    }
  }

  return false;
}
