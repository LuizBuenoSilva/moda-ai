"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (sessionStorage.getItem("pwa-banner-dismissed")) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  }

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm animate-slide-up">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-2xl shadow-purple-500/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">Y</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-100 text-sm">Instalar Yuzo</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acesse mais rápido direto da tela inicial do seu celular
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 py-2 rounded-xl text-sm font-medium gradient-bg text-white hover:opacity-90 transition-opacity"
          >
            Instalar App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
