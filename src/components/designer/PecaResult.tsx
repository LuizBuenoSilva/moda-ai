"use client";

import { useState } from "react";
import { PecaDesignGerada } from "@/types/designer";
import PecaSketch from "./PecaSketch";

interface PecaResultProps {
  peca: PecaDesignGerada;
}

export default function PecaResult({ peca }: PecaResultProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleCopyPrompt() {
    navigator.clipboard.writeText(peca.promptImagem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/gerar-peca/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(peca),
      });
      if (res.ok) {
        setSaved(true);
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

  return (
    <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-zinc-800">
        <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
          Conceito de Moda
        </span>
        <h2 className="text-2xl font-bold mt-1">{peca.nome}</h2>
        <p className="text-zinc-400 mt-2">{peca.descricao}</p>

        {/* Colors */}
        <div className="flex gap-2 mt-4">
          {peca.cores.map((cor, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg border border-zinc-700"
              style={{ backgroundColor: cor }}
              title={cor}
            />
          ))}
        </div>
      </div>

      {/* Sketch Visual */}
      <div className="p-8 border-b border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 text-zinc-200">
          Sketch do Design
        </h3>
        <PecaSketch peca={peca} />
      </div>

      {/* Technical Details */}
      <div className="p-8 border-b border-zinc-800">
        <h3 className="text-lg font-semibold mb-4 text-zinc-200">
          Detalhes Técnicos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Tecido</span>
            <p className="text-zinc-200 mt-1">{peca.tecido}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Corte</span>
            <p className="text-zinc-200 mt-1">{peca.corte}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Textura</span>
            <p className="text-zinc-200 mt-1">{peca.textura}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              Elementos Visuais
            </span>
            <p className="text-zinc-200 mt-1">{peca.elementosVisuais}</p>
          </div>
        </div>
      </div>

      {/* Image Prompt */}
      <div className="p-8 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-zinc-200">
            Prompt para Geração de Imagem
          </h3>
          <button
            onClick={handleCopyPrompt}
            className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copiar
              </>
            )}
          </button>
        </div>
        <div className="bg-zinc-950 rounded-xl p-4 font-mono text-sm text-purple-300 border border-zinc-800">
          {peca.promptImagem}
        </div>
      </div>

      {/* Usage Suggestion */}
      <div className="p-8 border-b border-zinc-800">
        <h3 className="text-lg font-semibold mb-3 text-zinc-200">
          Sugestão de Uso
        </h3>
        <p className="text-zinc-400">{peca.sugestaoUso}</p>
      </div>

      {/* Save Button */}
      <div className="p-8">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            saved
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "gradient-bg text-white hover:opacity-90"
          }`}
        >
          {saved ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Design Salvo na Coleção
            </>
          ) : saving ? (
            "Salvando..."
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Salvar Design
            </>
          )}
        </button>
        {saveError && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-3 text-center">
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
