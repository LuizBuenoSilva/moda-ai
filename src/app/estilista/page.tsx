"use client";

import { useState, useEffect, useCallback } from "react";
import { LookGerado } from "@/types/look";
import LookForm from "@/components/estilista/LookForm";
import LookResultList from "@/components/estilista/LookResultList";

const STORAGE_KEY = "estilista_looks";

function loadCachedLooks(): LookGerado[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export default function EstilistaPage() {
  const [looks, setLooks] = useState<LookGerado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLooks(loadCachedLooks());
    setHydrated(true);
  }, []);

  const saveLooks = useCallback((newLooks: LookGerado[]) => {
    setLooks(newLooks);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newLooks)); } catch { /* ignore */ }
  }, []);

  async function handleGenerate(formData: {
    estilo: string;
    ocasiao: string;
    orcamento: number;
    genero?: string;
    preferencias?: string;
  }) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gerar-looks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao gerar looks");
      }

      const data = await res.json();
      saveLooks(data.looks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">
            <span className="gradient-text">Estilista IA</span>
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Preencha suas preferências e nossa IA vai criar 3 looks completos e
            personalizados para você.
          </p>
        </div>

        <LookForm onSubmit={handleGenerate} loading={loading} />

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
              Criando seus looks personalizados...
            </p>
          </div>
        )}

        {hydrated && looks.length > 0 && !loading && (
          <div className="mt-6 mb-4 flex justify-center">
            <span className="text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-full">
              Looks anteriores &mdash; clique em &ldquo;Gerar&rdquo; para criar novos
            </span>
          </div>
        )}

        {looks.length > 0 && <LookResultList looks={looks} />}
      </div>
    </div>
  );
}
