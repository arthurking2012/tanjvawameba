export interface FileRecord {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  downloadsCount: number;
  createdAt: string;
  storageType?: 'local' | 'supabase';
  supabasePublicUrl?: string | null;
}

export interface UploadProgressItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  speedText?: string;
  loadedBytes: number;
  totalBytes: number;
  abortController?: AbortController;
  resultRecord?: FileRecord;
  errorMessage?: string;
}

export interface ServerStats {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
}

export interface ServerConfig {
  maxFileSizeMb: number;
  storageType: 'local' | 'supabase';
  allowedCategories: string[];
}
