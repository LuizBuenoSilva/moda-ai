"use client";

import { useState } from "react";
import { LookGerado } from "@/types/look";
import { getStoreSearchUrl } from "@/lib/store-urls";

// ── Main card ────────────────────────────────────────────────────────────────

interface LookCardProps {
  look: LookGerado;
  index: number;
}

export default function LookCard({ look, index }: LookCardProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/looks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(look),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        setSavedId(data.id);
      } else {
        const data = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        setSaveError(data.error || "Erro ao salvar");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro de conexão");
    } finally {
      setSaving(false);
    }
  }

  function handleViewAvatar() {
    sessionStorage.setItem("avatarOutfit", JSON.stringify(look.outfitJson));
    sessionStorage.setItem("avatarLookName", look.nome);
    const ts = Date.now();
    const url = savedId ? `/avatar?lookId=${savedId}&t=${ts}` : `/avatar?t=${ts}`;
    window.location.href = url;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
              Look {index + 1}
            </span>
            <h3 className="text-xl font-bold mt-1">{look.nome}</h3>
          </div>
          <span className="text-lg font-bold text-green-400">
            R${look.precoEstimado.toFixed(0)}
          </span>
        </div>
        <p className="text-sm text-zinc-400 mt-2">{look.descricao}</p>

        {/* Color swatches */}
        <div className="flex gap-2 mt-3">
          {look.cores.map((cor, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full border border-zinc-700"
              style={{ backgroundColor: cor }}
              title={cor}
            />
          ))}
        </div>
      </div>

      {/* Peças com foto */}
      <div className="p-6 space-y-4 flex-1">
        {look.pecas.map((peca, i) => (
          <div key={i} className="flex gap-3">
            {/* Color dot */}
            <div
              className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border border-white/10"
              style={{ backgroundColor: peca.cor + "33", borderColor: peca.cor + "55" }}
            >
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: peca.cor }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-zinc-100 truncate">
                  {peca.nome}
                </span>
                <span className="text-sm font-bold text-green-400 shrink-0">
                  R${peca.preco.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{peca.descricao}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {peca.tecido && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {peca.tecido}
                  </span>
                )}
                {peca.corte && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {peca.corte}
                  </span>
                )}
              </div>

              {/* Lojas */}
              {peca.lojas && peca.lojas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                  <span className="text-xs text-zinc-600">Ver em:</span>
                  {peca.lojas.map((loja, j) => (
                    <a
                      key={j}
                      href={getStoreSearchUrl(loja, peca.nome)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/25 hover:border-purple-400/40 transition-colors flex items-center gap-1"
                    >
                      {loja}
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Explicação */}
      <div className="px-6 pb-4">
        <p className="text-sm text-zinc-400 italic border-l-2 border-purple-500 pl-3">
          {look.explicacao}
        </p>
      </div>

      {/* Actions */}
      <div className="p-6 pt-2 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            saved
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
          }`}
        >
          {saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salvo
            </>
          ) : saving ? (
            "Salvando..."
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Salvar
            </>
          )}
        </button>
        <button
          onClick={handleViewAvatar}
          className="flex-1 py-3 rounded-xl font-medium text-sm gradient-bg text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
          </svg>
          Ver no Avatar
        </button>
      </div>

      {saveError && (
        <div className="px-6 pb-4">
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {saveError}
          </p>
        </div>
      )}
    </div>
  );
}
