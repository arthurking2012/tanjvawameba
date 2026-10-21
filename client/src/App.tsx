import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { FileList } from './components/FileList';
import { ShareModal } from './components/ShareModal';
import { DeleteModal } from './components/DeleteModal';
import { StatsModal } from './components/StatsModal';
import { PublicDownloadView } from './components/PublicDownloadView';
import type { FileRecord, ServerConfig } from './types';
import { Shield, Zap, Globe } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'upload' | 'files'>('upload');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [config, setConfig] = useState<ServerConfig | null>(null);

  // Modals state
  const [shareFile, setShareFile] = useState<FileRecord | null>(null);
  const [deleteFile, setDeleteFile] = useState<FileRecord | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Direct shared link detection (?file=ID or path /share/ID)
  const [sharedFileId, setSharedFileId] = useState<string | null>(null);

  useEffect(() => {
    // Check URL query parameter ?file=...
    const params = new URLSearchParams(window.location.search);
    const fileParam = params.get('file');

    // Or pathname /share/:id
    const pathMatch = window.location.pathname.match(/^\/share\/([a-zA-Z0-9_-]+)/);
    const pathFileId = pathMatch ? pathMatch[1] : null;

    if (fileParam) {
      setSharedFileId(fileParam);
    } else if (pathFileId) {
      setSharedFileId(pathFileId);
    }

    // Load initial data
    loadConfig();
    loadFiles();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await axios.get<ServerConfig>('/api/config');
      setConfig(res.data);
    } catch (err) {
      console.warn('Failed to load server config:', err);
    }
  };

  const loadFiles = async () => {
    try {
      const res = await axios.get<{ files: FileRecord[] }>('/api/files');
      setFiles(res.data.files || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    }
  };

  const handleUploadSuccess = (newFiles: FileRecord[]) => {
    setFiles((prev) => [...newFiles, ...prev]);
  };

  const handleDeleteConfirm = async (fileId: string) => {
    try {
      await axios.delete(`/api/files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'ფაილის წაშლის შეცდომა');
    }
  };

  const handleGoHome = () => {
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname.replace(/^\/share\/.*$/, '/'));
    setSharedFileId(null);
    setCurrentTab('upload');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070A12] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* Dynamic Ambient Background Lights */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Shared File Landing View or Main Application */}
      {sharedFileId ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
          <PublicDownloadView fileId={sharedFileId} onGoHome={handleGoHome} />
        </main>
      ) : (
        <>
          {/* Main Navigation */}
          <Navbar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            filesCount={files.length}
            config={config}
            onOpenStats={() => setIsStatsOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {currentTab === 'upload' ? (
              <UploadZone
                config={config}
                onUploadSuccess={handleUploadSuccess}
                onOpenShareModal={(file) => setShareFile(file)}
              />
            ) : (
              <FileList
                files={files}
                onDeleteFile={(file) => setDeleteFile(file)}
                onOpenShareModal={(file) => setShareFile(file)}
                onGoToUpload={() => setCurrentTab('upload')}
              />
            )}

            {/* Feature Highlights (Bottom Section) */}
            <section className="mt-20 pt-12 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              <div className="p-6 rounded-2xl glass-panel border border-indigo-900/30 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto md:mx-0">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">სწრაფი ატვირთვა</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ჩამოსატვირთი ბმული გენერირდება მყისიერად. არანაირი შეფერხება და რთული პროცესი.
                </p>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-indigo-900/30 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto md:mx-0">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">მარტივი გაზიარება</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  გაუგზავნეთ ბმული ნებისმიერ მოწყობილობას. მხარდაჭერილია QR კოდით მობილური ჩამოტვირთვაც.
                </p>
              </div>

              <div className="p-6 rounded-2xl glass-panel border border-indigo-900/30 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto md:mx-0">
                  <Shield className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">უსაფრთხო ჩამოტვირთვა</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ფაილები ინახება საიმედო საცავში და ჩამოიტვირთება თავდაპირველი სახელითა და ფორმატით.
                </p>
              </div>
            </section>
          </main>
        </>
      )}

      {/* Global Modals */}
      <ShareModal
        file={shareFile}
        isOpen={Boolean(shareFile)}
        onClose={() => setShareFile(null)}
      />

      <DeleteModal
        file={deleteFile}
        isOpen={Boolean(deleteFile)}
        onClose={() => setDeleteFile(null)}
        onConfirm={handleDeleteConfirm}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        config={config}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 CloudDrop. ყველა უფლება დაცულია.</p>
        <p className="flex items-center justify-center gap-1">
          <span>შექმნილია თანამედროვე ტექნოლოგიებით</span>
        </p>
      </footer>

    </div>
  );
}

export default App;
