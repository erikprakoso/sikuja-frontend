'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running as standalone app
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIOS && isSafari) {
      // Check if user dismissed iOS banner before
      const iosDismissed = localStorage.getItem('sikuja_pwa_ios_dismissed');
      if (!iosDismissed) {
        setShowIOSPrompt(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (showIOSPrompt) {
      localStorage.setItem('sikuja_pwa_ios_dismissed', 'true');
      setShowIOSPrompt(false);
    }
  };

  if (isDismissed) return null;

  // Android / Chrome / Windows / Mac PWA Prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-bounce-in">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 space-y-3 relative overflow-hidden">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 rounded-xl bg-[#E70013] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white leading-tight">Pasang Aplikasi SIKUJA</h4>
              <p className="text-xs text-slate-300 font-medium mt-0.5 leading-relaxed">
                Tambah ke layar utama HP untuk akses cepat layaknya aplikasi native.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-4 rounded-xl bg-[#E70013] hover:bg-[#E70013]/90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-[#E70013]"
            >
              <Download className="w-4 h-4" />
              Pasang Sekarang
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Nanti
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari Prompt
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-bounce-in">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 space-y-2.5 relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 rounded-xl bg-[#E70013] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Share className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white leading-tight">Pasang di iPhone / iPad</h4>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                Ketuk tombol <strong className="text-white font-bold">Bagikan (Share ⎋)</strong> di bawah Safari, lalu pilih <strong className="text-white font-bold">"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
