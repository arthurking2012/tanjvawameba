import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  Download,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import type { FileRecord } from '../types';
import { formatBytes, formatRelativeTime, getShareUrl, getDownloadUrl, getFileExtension } from '../utils/formatters';
import { getFileIconConfig } from '../utils/fileIcons';

interface ShareModalProps {
  file: FileRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ file, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen || !file) return null;

  const shareUrl = getShareUrl(file.id);
  const downloadUrl = getDownloadUrl(file.id);
  const iconConfig = getFileIconConfig(file.category, file.mimeType, file.originalName);
  const Icon = iconConfig.icon;
  const ext = getFileExtension(file.originalName);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl shadow-indigo-950/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <Icon className={`w-7 h-7 ${iconConfig.colorClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${iconConfig.badgeBg}`}>
                {ext}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> უსაფრთხო ბმული
              </span>
            </div>
            <h3 className="text-lg font-bold text-white truncate" title={file.originalName}>
              {file.originalName}
            </h3>
            <p className="text-xs text-slate-400">
              {formatBytes(file.size)} • {formatRelativeTime(file.createdAt)}
            </p>
          </div>
        </div>

        {/* Share Link Input */}
        <div className="space-y-4 mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            გაზიარების უნიკალური ბმული
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-indigo-500/20 focus-within:border-indigo-500/60 transition-colors">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-200 outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                copied
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>დაკოპირდა!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>კოპირება</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span>ℹ️</span> ამ ბმულით ნებისმიერ ადამიანს შეუძლია ფაილის ჩამოტვირთვა რეგისტრაციის გარეშე.
          </p>
        </div>

        {/* QR Code toggle section */}
        {showQR && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/20 flex flex-col items-center text-center animate-in fade-in duration-200">
            <div className="p-3 bg-white rounded-2xl shadow-xl mb-3">
              <QRCodeSVG value={shareUrl} size={160} level="H" includeMargin={false} />
            </div>
            <p className="text-xs text-slate-300 font-medium">
              დაასკანერეთ ტელეფონის კამერით ფაილის მობილურზე გასახსნელად
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-semibold border border-slate-700/50 transition-colors"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span>{showQR ? 'QR კოდის დამალვა' : 'QR კოდის ჩვენება'}</span>
          </button>

          <a
            href={downloadUrl}
            download={file.originalName}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>ჩამოტვირთვა</span>
          </a>
        </div>

      </div>
    </div>
  );
};
