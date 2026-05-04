import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DISMISSED_KEY = 'mframapa_install_dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted' || outcome === 'dismissed') {
      dismiss();
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] flex justify-center pb-4 px-4 transition-all duration-300 animate-in slide-in-from-bottom-6">
      <div className="w-full max-w-sm bg-slate-800 dark:bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none select-none">📍</span>
            <div>
              <p className="text-white font-semibold text-base leading-tight">Install Mframapa</p>
              <p className="text-slate-400 text-sm mt-0.5">Get air quality updates offline</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleInstall}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors duration-200"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            className="flex-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl py-2.5 transition-colors duration-200"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
