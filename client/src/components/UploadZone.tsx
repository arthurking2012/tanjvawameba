import React, { useState, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  FileUp,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  Loader2,
  Ban
} from 'lucide-react';
import type { UploadProgressItem, FileRecord, ServerConfig } from '../types';
import { formatBytes, getFileExtension, getShareUrl, getDownloadUrl } from '../utils/formatters';
import { getFileIconConfig } from '../utils/fileIcons';

interface UploadZoneProps {
  config: ServerConfig | null;
  onUploadSuccess: (newFiles: FileRecord[]) => void;
  onOpenShareModal: (file: FileRecord) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  config,
  onUploadSuccess,
  onOpenShareModal
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgressItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSizeMb = config?.maxFileSizeMb || 500;
  const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset input
    }
  };

  const handleFiles = (files: File[]) => {
    const newItems: UploadProgressItem[] = files.map((file) => {
      const abortController = new AbortController();
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'uploading',
        loadedBytes: 0,
        totalBytes: file.size,
        abortController
      };
    });

    setUploadQueue((prev) => [...newItems, ...prev]);

    // Start uploads
    newItems.forEach((item) => startUpload(item));
  };

  const startUpload = async (item: UploadProgressItem) => {
    // Validate file size client-side
    if (item.file.size > maxFileSizeBytes) {
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: 'error',
                errorMessage: `ფაილის ზომა აღემატება ${maxFileSizeMb} MB-ს.`
              }
            : q
        )
      );
      return;
    }

    const formData = new FormData();
    formData.append('files', item.file);

    let startTime = Date.now();
    let lastLoaded = 0;

    try {
      const response = await axios.post<{ success: boolean; files: FileRecord[] }>(
        '/api/upload',
        formData,
        {
          signal: item.abortController?.signal,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const now = Date.now();
              const timeDiff = (now - startTime) / 1000;
              let speedText = '';

              if (timeDiff > 0.3) {
                const bytesDiff = progressEvent.loaded - lastLoaded;
                const speedBytesPerSec = bytesDiff / timeDiff;
                speedText = `${formatBytes(speedBytesPerSec)}/წმ`;
                startTime = now;
                lastLoaded = progressEvent.loaded;
              }

              setUploadQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id
                    ? {
                        ...q,
                        progress: percent,
                        loadedBytes: progressEvent.loaded,
                        totalBytes: progressEvent.total || item.size,
                        speedText: speedText || q.speedText
                      }
                    : q
                )
              );
            }
          }
        }
      );

      if (response.data.success && response.data.files.length > 0) {
        const uploadedFile = response.data.files[0];

        // Trigger confetti for celebratory effect!
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981']
        });

        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  progress: 100,
                  status: 'completed',
                  resultRecord: uploadedFile
                }
              : q
          )
        );

        onUploadSuccess([uploadedFile]);
      }
    } catch (error: any) {
      if (axios.isCancel(error) || error.name === 'CanceledError') {
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'cancelled',
                  errorMessage: 'ატვირთვა გაუქმდა.'
                }
              : q
          )
        );
      } else {
        const message =
          error.response?.data?.error ||
          error.message ||
          'ფაილის ატვირთვისას მოხდა შეცდომა.';
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'error',
                  errorMessage: message
                }
              : q
          )
        );
      }
    }
  };

  const handleCancelUpload = (id: string) => {
    const item = uploadQueue.find((q) => q.id === id);
    if (item && item.abortController) {
      item.abortController.abort();
    }
  };

  const handleRemoveQueueItem = (id: string) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleCopyLink = (fileRecord: FileRecord) => {
    const url = getShareUrl(fileRecord.id);
    navigator.clipboard.writeText(url);
    setCopiedId(fileRecord.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Heading */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>შეუზღუდავი და სწრაფი ფაილების გაზიარება</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-sans">
          ატვირთე და გააზიარე <span className="text-gradient">მყისიერად</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          ატვირთეთ ნებისმიერი ტიპის ფაილი, მიიღეთ უნიკალური ბმული და გაუგზავნეთ მეგობრებს ან კოლეგებს ერთი დაწკაპუნებით.
        </p>
      </div>

      {/* Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01] shadow-2xl shadow-indigo-500/30 ring-4 ring-indigo-500/20'
            : 'border-indigo-500/30 hover:border-indigo-400/70 bg-slate-900/40 hover:bg-slate-900/70 shadow-xl'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />

        {/* Floating Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-indigo-600/5 to-purple-600/10 rounded-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated Icon Circle */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-indigo-500/30 transition-all duration-300">
            <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 group-hover:text-indigo-300 transition-colors group-hover:animate-bounce" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            გადაათრიეთ ფაილი აქ ან <span className="text-indigo-400 underline underline-offset-4">აირჩიეთ</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            მხარდაჭერილია ნებისმიერი ფორმატი (ფოტოები, ვიდეოები, მუსიკა, PDF, ZIP, პროგრამები და სხვა).
          </p>

          <button
            type="button"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-500/50 transition-all duration-200"
          >
            <FileUp className="w-4 h-4" />
            <span>ფაილის არჩევა კომპიუტერიდან</span>
          </button>

          <div className="mt-8 flex flex-wrap justify-center items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              📸 ფოტოები
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              🎥 ვიდეოები
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              🎵 მუსიკა
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              📄 PDF & Docs
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              📦 ZIP & RAR
            </span>
            <span className="px-3 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 font-semibold">
              მაქსიმუმ {maxFileSizeMb} MB
            </span>
          </div>
        </div>
      </div>

      {/* Active Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>ატვირთვის რიგი</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                {uploadQueue.length}
              </span>
            </h3>
            {uploadQueue.some((q) => q.status !== 'uploading') && (
              <button
                onClick={() => setUploadQueue((prev) => prev.filter((q) => q.status === 'uploading'))}
                className="text-xs text-slate-400 hover:text-slate-200 underline transition-colors"
              >
                დასრულებულების გასუფთავება
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uploadQueue.map((item) => {
              const ext = getFileExtension(item.name);
              const iconConfig = getFileIconConfig('other', undefined, item.name);
              const Icon = iconConfig.icon;

              return (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-4 sm:p-5 border border-indigo-500/20 shadow-lg relative overflow-hidden transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* File Icon */}
                    <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-6 h-6 ${iconConfig.colorClass}`} />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${iconConfig.badgeBg}`}>
                            {ext}
                          </span>
                          <p className="text-sm font-semibold text-white truncate" title={item.name}>
                            {item.name}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-400 flex-shrink-0">
                          {formatBytes(item.size)}
                        </span>
                      </div>

                      {/* Progress / Status display */}
                      {item.status === 'uploading' && (
                        <div className="space-y-2 mt-2">
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-150"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                              <span>იტვირთება... {item.progress}%</span>
                              {item.speedText && <span className="text-slate-500">({item.speedText})</span>}
                            </span>
                            <span>
                              {formatBytes(item.loadedBytes)} / {formatBytes(item.totalBytes)}
                            </span>
                          </div>
                        </div>
                      )}

                      {item.status === 'completed' && item.resultRecord && (
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>ფაილი წარმატებით აიტვირთა სერვერზე!</span>
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyLink(item.resultRecord!)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                copiedId === item.resultRecord.id
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                              }`}
                            >
                              {copiedId === item.resultRecord.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>დაკოპირდა</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>ბმულის კოპირება</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => onOpenShareModal(item.resultRecord!)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="დეტალები და QR"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <a
                              href={getDownloadUrl(item.resultRecord.id)}
                              download={item.resultRecord.originalName}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="ჩამოტვირთვა"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {item.status === 'error' && (
                        <div className="flex items-center justify-between gap-2 mt-2 text-xs text-rose-400">
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{item.errorMessage || 'ატვირთვა ვერ მოხერხდა'}</span>
                          </span>
                        </div>
                      )}

                      {item.status === 'cancelled' && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
                          <Ban className="w-4 h-4" />
                          <span>ატვირთვა გაუქმდა.</span>
                        </div>
                      )}
                    </div>

                    {/* Actions: Cancel or Dismiss */}
                    <div className="flex items-center">
                      {item.status === 'uploading' ? (
                        <button
                          onClick={() => handleCancelUpload(item.id)}
                          title="ატვირთვის გაუქმება"
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoveQueueItem(item.id)}
                          title="გასუფთავება"
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
