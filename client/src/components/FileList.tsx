import React, { useState } from 'react';
import {
  Search,
  Download,
  Share2,
  Trash2,
  LayoutGrid,
  List,
  Check,
  Copy,
  ArrowUpDown,
  FileQuestion,
  Sparkles
} from 'lucide-react';
import type { FileRecord } from '../types';
import {
  formatBytes,
  formatRelativeTime,
  getFileExtension,
  getShareUrl,
  getDownloadUrl
} from '../utils/formatters';
import { getFileIconConfig } from '../utils/fileIcons';

interface FileListProps {
  files: FileRecord[];
  onDeleteFile: (file: FileRecord) => void;
  onOpenShareModal: (file: FileRecord) => void;
  onGoToUpload: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onDeleteFile,
  onOpenShareModal,
  onGoToUpload
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'size' | 'downloads'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'ყველა' },
    { id: 'image', label: 'სურათები' },
    { id: 'video', label: 'ვიდეო' },
    { id: 'audio', label: 'აუდიო' },
    { id: 'document', label: 'დოკუმენტები' },
    { id: 'archive', label: 'არქივები' },
    { id: 'other', label: 'სხვა' }
  ];

  // Filtering
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.originalName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sorting
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'name') {
      return a.originalName.localeCompare(b.originalName);
    }
    if (sortBy === 'size') {
      return b.size - a.size;
    }
    if (sortBy === 'downloads') {
      return (b.downloadsCount || 0) - (a.downloadsCount || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCopyLink = (file: FileRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getShareUrl(file.id);
    navigator.clipboard.writeText(url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Filter and Search Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-indigo-900/40 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ფაილის ძებნა სახელით..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded"
              >
                გასუფთავება
              </button>
            )}
          </div>

          {/* Controls: Sorting and View Mode */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs sm:text-sm text-slate-200 outline-none cursor-pointer focus:border-indigo-500"
              >
                <option value="newest">უახლესი</option>
                <option value="name">სახელით (A-Z)</option>
                <option value="size">ზომით (დიდი &gt; პატარა)</option>
                <option value="downloads">ჩამოტვირთვებით</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900/80 rounded-xl p-1 border border-slate-700/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="ბადისებრი ხედი"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="სიისებრი ხედი"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                  : 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
              {cat.id === 'all' && files.length > 0 && ` (${files.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Files List / Grid Area */}
      {sortedFiles.length === 0 ? (
        /* Empty State */
        <div className="glass-panel rounded-3xl p-12 text-center border border-indigo-900/30 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {search ? 'ფაილი ვერ მოიძებნა' : 'ფაილები ჯერ არ არის ატვირთული'}
          </h3>
          <p className="text-sm text-slate-400">
            {search
              ? 'სცადეთ სხვა საძიებო სიტყვა ან შეცვალეთ კატეგორიის ფილტრი.'
              : 'ატვირთეთ თქვენი პირველი ფაილი და გაუზიარეთ ნებისმიერ ადამიანს წამებში.'}
          </p>
          {!search && (
            <button
              onClick={onGoToUpload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>ფაილის ატვირთვა</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {sortedFiles.map((file) => {
            const ext = getFileExtension(file.originalName);
            const iconConfig = getFileIconConfig(file.category, file.mimeType, file.originalName);
            const Icon = iconConfig.icon;
            const downloadUrl = getDownloadUrl(file.id);

            return (
              <div
                key={file.id}
                className="glass-card rounded-2xl p-5 border border-indigo-500/20 shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Icon & Extension Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-indigo-500/20 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Icon className={`w-6 h-6 ${iconConfig.colorClass}`} />
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${iconConfig.badgeBg}`}>
                      {ext}
                    </span>
                  </div>

                  {/* File Name */}
                  <h4
                    className="font-bold text-white text-base truncate mb-1"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </h4>

                  {/* Metadata */}
                  <div className="text-xs text-slate-400 space-y-1 mb-4">
                    <p className="flex items-center justify-between">
                      <span>ზომა:</span>
                      <span className="font-semibold text-slate-300">{formatBytes(file.size)}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>ჩამოტვირთვები:</span>
                      <span className="font-semibold text-indigo-300">
                        {file.downloadsCount || 0}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>თარიღი:</span>
                      <span>{formatRelativeTime(file.createdAt)}</span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Copy Share Link */}
                    <button
                      onClick={(e) => handleCopyLink(file, e)}
                      title="ბმულის კოპირება"
                      className={`p-2 rounded-xl transition-all ${
                        copiedId === file.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {copiedId === file.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {/* Open Share Modal / QR */}
                    <button
                      onClick={() => onOpenShareModal(file)}
                      title="გაზიარება და QR კოდი"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-purple-400" />
                    </button>

                    {/* Delete File */}
                    <button
                      onClick={() => onDeleteFile(file)}
                      title="ფაილის წაშლა"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Direct Download */}
                  <a
                    href={downloadUrl}
                    download={file.originalName}
                    title="ფაილის ჩამოტვირთვა"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-transform active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ჩამოტვირთვა</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="glass-panel rounded-3xl overflow-hidden border border-indigo-900/40 divide-y divide-slate-800/80">
          {sortedFiles.map((file) => {
            const ext = getFileExtension(file.originalName);
            const iconConfig = getFileIconConfig(file.category, file.mimeType, file.originalName);
            const Icon = iconConfig.icon;
            const downloadUrl = getDownloadUrl(file.id);

            return (
              <div
                key={file.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-900/80 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 ${iconConfig.colorClass}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${iconConfig.badgeBg}`}>
                        {ext}
                      </span>
                      <h4 className="font-semibold text-white text-sm sm:text-base truncate max-w-xs sm:max-w-md" title={file.originalName}>
                        {file.originalName}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>{file.downloadsCount || 0} ჩამოტვირთვა</span>
                      <span>•</span>
                      <span>{formatRelativeTime(file.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => handleCopyLink(file, e)}
                    title="ბმულის კოპირება"
                    className={`p-2 rounded-xl transition-all ${
                      copiedId === file.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {copiedId === file.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onOpenShareModal(file)}
                    title="გაზიარება და QR"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-purple-400" />
                  </button>

                  <a
                    href={downloadUrl}
                    download={file.originalName}
                    title="ჩამოტვირთვა"
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => onDeleteFile(file)}
                    title="წაშლა"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
