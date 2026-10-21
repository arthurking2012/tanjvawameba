import React from 'react';
import { CloudUpload, HardDrive, Database, BarChart3, Files } from 'lucide-react';
import type { ServerConfig } from '../types';

interface NavbarProps {
  currentTab: 'upload' | 'files';
  setCurrentTab: (tab: 'upload' | 'files') => void;
  filesCount: number;
  config: ServerConfig | null;
  onOpenStats: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  filesCount,
  config,
  onOpenStats
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-indigo-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentTab('upload')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <CloudUpload className="w-6 h-6 text-white group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500 -z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white font-sans">
                Cloud<span className="text-gradient">Drop</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">სწრაფი და უსაფრთხო ფაილსაცავი</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={() => setCurrentTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              currentTab === 'upload'
                ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-indigo-600/20 border border-indigo-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>ატვირთვა</span>
          </button>

          <button
            onClick={() => setCurrentTab('files')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
              currentTab === 'files'
                ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-indigo-600/20 border border-indigo-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Files className="w-4 h-4" />
            <span>ჩემი ფაილები</span>
            {filesCount > 0 && (
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-bold border border-indigo-400/20">
                {filesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Actions & Storage Status */}
        <div className="flex items-center gap-3">
          {/* Storage Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            {config?.storageType === 'supabase' ? (
              <>
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Supabase Cloud</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <span>ლოკალური სერვერი</span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>მაქს. {config?.maxFileSizeMb || 500} MB</span>
          </div>

          {/* Stats Button */}
          <button
            onClick={onOpenStats}
            title="სტატისტიკა"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50 transition-all hover:scale-105 active:scale-95"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
