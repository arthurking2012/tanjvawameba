import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  FileSpreadsheet,
  FileCode,
  File
} from 'lucide-react';

interface FileIconConfig {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeBg: string;
}

export function getFileIconConfig(category: string, mimeType?: string, filename?: string): FileIconConfig {
  const ext = (filename?.split('.').pop() || '').toLowerCase();

  if (category === 'image' || mimeType?.startsWith('image/')) {
    return {
      icon: ImageIcon,
      colorClass: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    };
  }

  if (category === 'video' || mimeType?.startsWith('video/')) {
    return {
      icon: Video,
      colorClass: 'text-violet-400',
      badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/30'
    };
  }

  if (category === 'audio' || mimeType?.startsWith('audio/')) {
    return {
      icon: Music,
      colorClass: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    };
  }

  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return {
      icon: FileSpreadsheet,
      colorClass: 'text-green-400',
      badgeBg: 'bg-green-500/10 text-green-400 border-green-500/30'
    };
  }

  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'json', 'c', 'cpp', 'java'].includes(ext)) {
    return {
      icon: FileCode,
      colorClass: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
    };
  }

  if (category === 'archive' || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      icon: Archive,
      colorClass: 'text-orange-400',
      badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
    };
  }

  if (category === 'document' || ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
    return {
      icon: FileText,
      colorClass: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    };
  }

  return {
    icon: File,
    colorClass: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  };
}
