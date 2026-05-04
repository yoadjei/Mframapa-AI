import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

const DISMISSED_KEY = 'mframapa_ios_dismissed';

function isIOSSafari() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isSafari = !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && isSafari;
}

export default function IOSInstallModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyStandalone = window.navigator.standalone === true;
    const dismissed = !!localStorage.getItem(DISMISSED_KEY);

    if (isIOSSafari() && !alreadyStandalone && !dismissed) {
      // Small delay so it doesn't pop up immediately on page load
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="w-full max-w-sm bg-slate-800 dark:bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none select-none">📍</span>
            <div>
              <p className="text-white font-semibold text-base leading-tight">Add to Home Screen</p>
              <p className="text-slate-400 text-sm mt-0.5">Install for the best experience</p>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Close"
            className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-700/60" />

        {/* Steps */}
        <ol className="flex flex-col gap-4">
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <span className="text-emerald-400 text-xs font-bold">1</span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <p className="text-slate-200 text-sm">Tap the <strong className="text-white">Share</strong> button</p>
              <Share className="h-4 w-4 text-slate-400 shrink-0" />
              <p className="text-slate-400 text-sm">at the bottom of your browser</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <span className="text-emerald-400 text-xs font-bold">2</span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <p className="text-slate-200 text-sm">Scroll and tap <strong className="text-white">Add to Home Screen</strong></p>
              <PlusSquare className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <span className="text-emerald-400 text-xs font-bold">3</span>
            </div>
            <p className="text-slate-200 text-sm pt-0.5">Tap <strong className="text-white">Add</strong> to confirm</p>
          </li>
        </ol>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl py-2.5 transition-colors duration-200"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
