import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'files.json');

// Ensure data directory and db file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
}

/**
 * Read all file records from persistent storage
 */
export function getAllFiles() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const files = JSON.parse(raw);
    return Array.isArray(files) ? files : [];
  } catch (err) {
    console.error('Error reading db:', err);
    return [];
  }
}

/**
 * Save all file records safely with atomic write
 */
export function saveFiles(files) {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(files, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error saving db:', err);
    return false;
  }
}

/**
 * Find a file record by its unique ID
 */
export function getFileById(id) {
  const files = getAllFiles();
  return files.find(f => f.id === id) || null;
}

/**
 * Insert a new file record
 */
export function createFile(record) {
  const files = getAllFiles();
  files.unshift(record);
  saveFiles(files);
  return record;
}

/**
 * Increment the download count of a file
 */
export function incrementDownloads(id) {
  const files = getAllFiles();
  const file = files.find(f => f.id === id);
  if (file) {
    file.downloadsCount = (file.downloadsCount || 0) + 1;
    file.lastDownloadedAt = new Date().toISOString();
    saveFiles(files);
    return file;
  }
  return null;
}

/**
 * Delete a file record by ID
 */
export function deleteFileRecord(id) {
  const files = getAllFiles();
  const index = files.findIndex(f => f.id === id);
  if (index !== -1) {
    const removed = files.splice(index, 1)[0];
    saveFiles(files);
    return removed;
  }
  return null;
}

/**
 * Get aggregate statistics
 */
export function getStats() {
  const files = getAllFiles();
  const totalFiles = files.length;
  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalDownloads = files.reduce((acc, f) => acc + (f.downloadsCount || 0), 0);
  return {
    totalFiles,
    totalSize,
    totalDownloads
  };
}
