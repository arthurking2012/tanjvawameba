import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { FileRecord } from '../types';
import { formatBytes } from '../utils/formatters';

interface DeleteModalProps {
  file: FileRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileId: string) => Promise<void>;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  file,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !file) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      await onConfirm(file.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/30 shadow-2xl shadow-rose-950/40 relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ფაილის წაშლა</h3>
            <p className="text-xs text-slate-400">ეს მოქმედება შეუქცევადია</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm space-y-1">
          <p className="font-semibold text-white truncate" title={file.originalName}>
            {file.originalName}
          </p>
          <p className="text-xs text-slate-400">
            ზომა: {formatBytes(file.size)}
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          ნამდვილად გსურთ ფაილის წაშლა? ფაილი სამუდამოდ წაიშლება სერვერიდან და ყველა არსებული გაზიარების ბმული გაუქმდება.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
          >
            გაუქმება
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>წაშლა</span>
          </button>
        </div>
      </div>
    </div>
  );
};
