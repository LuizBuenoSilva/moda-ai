"use client";

import { useState, useEffect, useCallback } from "react";
import { PecaDesignGerada } from "@/types/designer";
import PecaForm from "@/components/designer/PecaForm";
import DesignerChat from "@/components/designer/DesignerChat";
import DesignerPreview from "@/components/designer/DesignerPreview";

const STORAGE_KEY = "designer_peca";

function loadCachedPeca(): PecaDesignGerada | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export default function DesignerPage() {
  const [peca, setPeca] = useState<PecaDesignGerada | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div className="px-6 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold">
              <span className="gradient-text">Designer de Moda</span>
            </h1>
            <p className="text-sm text-zinc-500">
              Converse com a IA para refinar seu design
            </p>
          </div>
          <button
            onClick={handleNewDesign}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Design
          </button>
        </div>

        {/* Split view */}
        <div className="flex-1 flex min-h-0">
          {/* Left: Chat */}
          <div className="w-1/2 border-r border-zinc-800 p-4 flex flex-col min-h-0">
            <DesignerChat peca={peca} onPecaUpdate={updatePeca} />
          </div>

          {/* Right: Preview */}
          <div className="w-1/2 bg-zinc-950 overflow-hidden">
            <DesignerPreview peca={peca} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">
            <span className="gradient-text">Designer de Moda</span>
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Crie conceitos visuais detalhados de roupas com detalhes técnicos e
            prompts para geração de imagem com IA.
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
