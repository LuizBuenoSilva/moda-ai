"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PecaDesignGerada } from "@/types/designer";
import PecaForm from "@/components/designer/PecaForm";
import DesignerChat from "@/components/designer/DesignerChat";
import DesignerPreview, { DesignerPreviewHandle } from "@/components/designer/DesignerPreview";

const STORAGE_KEY = "designer_peca";

function loadCachedPeca(): PecaDesignGerada | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

type MobileTab = "chat" | "preview";

export default function DesignerPage() {
  const [peca, setPeca] = useState<PecaDesignGerada | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const previewRef = useRef<DesignerPreviewHandle>(null);

  useEffect(() => {
    const cached = loadCachedPeca();
    if (cached) setPeca(cached);
  }, []);

  const updatePeca = useCallback((newPeca: PecaDesignGerada | null) => {
    setPeca(newPeca);
    try {
      if (newPeca) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newPeca));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSketchRegenerate = useCallback(() => {
    previewRef.current?.generateSvg();
  }, []);

  const handleSwitchToPreview = useCallback(() => {
    setMobileTab("preview");
  }, []);

  async function handleGenerate(formData: {
    tipo: string;
    estilo: string;
    inspiracao: string;
    cores: string;
    detalhes: string;
  }) {
    setLoading(true);
    setError(null);
    setPeca(null);

    try {
      const res = await fetch("/api/gerar-peca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao gerar conceito");
      }

      const data = await res.json();
      updatePeca(data.peca);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleNewDesign() {
    updatePeca(null);
    setError(null);
  }

  if (peca) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col">
        {/* Header bar */}
        <div className="px-4 md:px-6 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg md:text-xl font-bold">
              <span className="gradient-text">Designer de Moda</span>
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 hidden sm:block">
              Converse com a IA para refinar seu design
            </p>
          </div>
          <button
            onClick={handleNewDesign}
            className="px-3 md:px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Novo Design</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>

        {/* Mobile tab switcher */}
        <div className="md:hidden px-4 py-2 border-b border-zinc-800 shrink-0">
          <div className="flex bg-zinc-800/60 rounded-lg p-0.5">
            <button
              onClick={() => setMobileTab("chat")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mobileTab === "chat"
                  ? "bg-purple-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                mobileTab === "preview"
                  ? "bg-purple-600 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
          </div>
        </div>

        {/* Split view (desktop) / Tab view (mobile) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Chat */}
          <div className={`md:w-1/2 md:border-r border-zinc-800 p-4 flex flex-col min-h-0 ${
            mobileTab === "chat" ? "flex-1" : "hidden md:flex"
          }`}>
            <DesignerChat
              peca={peca}
              onPecaUpdate={updatePeca}
              onSketchRegenerate={handleSketchRegenerate}
              onSwitchToPreview={handleSwitchToPreview}
            />
          </div>

          {/* Preview */}
          <div className={`md:w-1/2 bg-zinc-950 overflow-hidden ${
            mobileTab === "preview" ? "flex-1" : "hidden md:block"
          }`}>
            <DesignerPreview ref={previewRef} peca={peca} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-8 md:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="gradient-text">Designer de Moda</span>
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm md:text-base">
            Crie conceitos visuais detalhados de roupas com detalhes técnicos e
            sketches únicos gerados por IA.
          </p>
        </div>

        <PecaForm onSubmit={handleGenerate} loading={loading} />

        {error && (
          <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-bg pulse-glow flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <p className="text-zinc-400 animate-pulse">
              Criando conceito da peça...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
