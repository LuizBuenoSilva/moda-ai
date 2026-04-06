"use client";

import { useState, useRef } from "react";
import { PecaDesignGerada } from "@/types/designer";
import PecaSketch, { PecaSketchHandle } from "./PecaSketch";

interface DesignerPreviewProps {
  peca: PecaDesignGerada;
}

export default function DesignerPreview({ peca }: DesignerPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const sketchRef = useRef<PecaSketchHandle>(null);

  function handleCopyPrompt() {
    navigator.clipboard.writeText(peca.promptImagem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadImage() {
    const dataUrl = sketchRef.current?.exportImage();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${peca.nome.replace(/\s+/g, "_")}_sketch.png`;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
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
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Sketch with drawing tools */}
      <div className="p-4">
        <PecaSketch ref={sketchRef} peca={peca} editable />
      </div>

      {/* Name + colors */}
      <div className="px-5 pb-3">
        <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
          {peca.tipo} &bull; {peca.estilo}
        </span>
        <h2 className="text-lg font-bold mt-1">{peca.nome}</h2>
        <div className="flex gap-2 mt-2">
          {peca.cores.map((cor, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-lg border border-zinc-700"
              style={{ backgroundColor: cor }}
              title={cor}
            />
          ))}
        </div>
      </div>

      {/* Technical details grid */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Tecido</span>
            <p className="text-sm text-zinc-200 mt-0.5">{peca.tecido}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Corte</span>
            <p className="text-sm text-zinc-200 mt-0.5">{peca.corte}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Textura</span>
            <p className="text-sm text-zinc-200 mt-0.5">{peca.textura}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Elementos</span>
            <p className="text-sm text-zinc-200 mt-0.5">{peca.elementosVisuais}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 pb-3">
        <p className="text-sm text-zinc-400">{peca.descricao}</p>
      </div>

      {/* Prompt toggle */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
        >
          <svg className={`w-4 h-4 transition-transform ${showPrompt ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Prompt de imagem
        </button>
        {showPrompt && (
          <div className="mt-2 bg-zinc-950 rounded-lg p-3 font-mono text-xs text-purple-300 border border-zinc-800 relative">
            {peca.promptImagem}
            <button
              onClick={handleCopyPrompt}
              className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 mt-auto space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
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
                Salvo
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
          <button
            onClick={handleDownloadImage}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center gap-2"
          >
            {downloaded ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Baixado
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar PNG
              </>
            )}
          </button>
        </div>
        {saveError && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
