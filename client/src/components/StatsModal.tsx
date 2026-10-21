import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  BarChart3,
  Files,
  HardDrive,
  Download,
  Database,
  Shield,
  Loader2
} from 'lucide-react';
import type { ServerStats, ServerConfig } from '../types';
import { formatBytes } from '../utils/formatters';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ServerConfig | null;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, config }) => {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get<ServerStats>('/api/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">სისტემური სტატისტიკა</h3>
            <p className="text-xs text-slate-400">საცავისა და ფაილების აქტივობა</p>
          </div>
        </div>

        {/* 3 Metric Cards */}
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">ფაილები</span>
                <Files className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-white">{stats?.totalFiles || 0}</p>
              <p className="text-[10px] text-slate-500">სულ ატვირთული</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">საცავი</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white">{formatBytes(stats?.totalSize || 0)}</p>
              <p className="text-[10px] text-slate-500">გამოყენებული მოცულობა</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">ჩამოტვირთვები</span>
                <Download className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">{stats?.totalDownloads || 0}</p>
              <p className="text-[10px] text-slate-500">სულ მიწოდებული</p>
            </div>
          </div>
        )}

        {/* System Details Box */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-indigo-900/40 space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">საცავის მოდელი:</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              {config?.storageType === 'supabase' ? (
                <>
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase Object Storage (Cloud)</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>ლოკალური მუდმივი დისკი</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">მაქსიმალური ფაილის ზომა:</span>
            <span className="font-semibold text-indigo-400">{config?.maxFileSizeMb || 500} MB</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">ჩამოტვირთვის უსაფრთხოება:</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Sanitized Headers & Streams</span>
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
        >
          დახურვა
        </button>

      </div>
    </div>
  );
};
