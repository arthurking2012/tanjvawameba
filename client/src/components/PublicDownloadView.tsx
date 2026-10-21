import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  CloudUpload,
  AlertCircle,
  Loader2,
  FileDown
} from 'lucide-react';
import type { FileRecord } from '../types';
import { formatBytes, formatRelativeTime, formatDateFull, getFileExtension, getDownloadUrl } from '../utils/formatters';
import { getFileIconConfig } from '../utils/fileIcons';

interface PublicDownloadViewProps {
  fileId: string;
  onGoHome: () => void;
}

export const PublicDownloadView: React.FC<PublicDownloadViewProps> = ({ fileId, onGoHome }) => {
  const [file, setFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get<FileRecord>(`/api/files/${fileId}`);
        setFile(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'ფაილი ვერ მოიძებნა ან ვადაგასულია.');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    setDownloadStarted(true);
    if (file) {
      setFile({
        ...file,
        downloadsCount: (file.downloadsCount || 0) + 1
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">ფაილის ინფორმაცია იტვირთება...</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="max-w-md mx-auto my-16 glass-panel rounded-3xl p-8 sm:p-10 text-center border border-rose-500/30 space-y-5 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">ფაილი ვერ მოიძებნა</h2>
        <p className="text-sm text-slate-400">
          ეს ფაილი წაშლილია ან არასწორი ბმულია გამოყენებული.
        </p>
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
        >
          <CloudUpload className="w-4 h-4" />
          <span>მთავარ გვერდზე დაბრუნება</span>
        </button>
      </div>
    );
  }

  const iconConfig = getFileIconConfig(file.category, file.mimeType, file.originalName);
  const Icon = iconConfig.icon;
  const ext = getFileExtension(file.originalName);
  const downloadUrl = getDownloadUrl(file.id);

  return (
    <div className="max-w-2xl mx-auto my-10 px-4 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>←</span>
          <span>CloudDrop-ზე საკუთარი ფაილის ატვირთვა</span>
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>უსაფრთხო ჩამოტვირთვა</span>
        </span>
      </div>

      {/* Main File Showcase Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-indigo-500/30 shadow-2xl shadow-indigo-950/60 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          
          {/* Header Preview */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/30 flex items-center justify-center shadow-xl flex-shrink-0">
              <Icon className={`w-12 h-12 sm:w-14 sm:h-14 ${iconConfig.colorClass}`} />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-lg border ${iconConfig.badgeBg}`}>
                  {ext}
                </span>
                <span className="text-xs text-slate-400">
                  ატვირთულია: {formatRelativeTime(file.createdAt)}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white break-words">
                {file.originalName}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-300 font-medium pt-1">
                <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                  💾 {formatBytes(file.size)}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                  📥 {file.downloadsCount || 0} ჩამოტვირთვა
                </span>
              </div>
            </div>
          </div>

          {/* Large Download Button */}
          <div className="space-y-3">
            <a
              href={downloadUrl}
              download={file.originalName}
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-base sm:text-lg shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <FileDown className="w-6 h-6 animate-bounce" />
              <span>ფაილის ჩამოტვირთვა ({formatBytes(file.size)})</span>
            </a>

            {downloadStarted && (
              <p className="text-center text-xs text-emerald-400 font-semibold animate-in fade-in">
                ✓ ჩამოტვირთვა დაწყებულია! თუ არ დაიწყო, დააჭირეთ ღილაკს ხელახლა.
              </p>
            )}
          </div>

          {/* Secondary Actions: Copy Link & QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-800 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">ბმული დაკოპირდა!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>გაზიარების ბმულის კოპირება</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-800 transition-colors"
            >
              <QrCode className="w-4 h-4 text-purple-400" />
              <span>{showQR ? 'QR კოდის დამალვა' : 'QR კოდი ტელეფონისთვის'}</span>
            </button>
          </div>

          {/* QR Code Container */}
          {showQR && (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex flex-col items-center text-center animate-in fade-in duration-200">
              <div className="p-4 bg-white rounded-2xl shadow-xl mb-3">
                <QRCodeSVG value={window.location.href} size={180} level="H" includeMargin={false} />
              </div>
              <p className="text-xs text-slate-300 font-medium">
                დაასკანერეთ თქვენი სმარტფონით და ჩამოტვირთეთ პირდაპირ ტელეფონში.
              </p>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="text-center text-xs text-slate-500 pt-2">
            ატვირთვის ზუსტი დრო: {formatDateFull(file.createdAt)}
          </div>

        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-indigo-900/30 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">გსურთ საკუთარი ფაილების გაზიარება?</h4>
          <p className="text-xs text-slate-400">ატვირთეთ ნებისმიერი ფაილი უფასოდ და მიიღეთ ჩამოსატვირთი ბმული.</p>
        </div>
        <button
          onClick={onGoHome}
          className="flex-shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
        >
          ატვირთვა
        </button>
      </div>

    </div>
  );
};
