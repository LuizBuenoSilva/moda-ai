"use client";

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { PecaDesignGerada } from "@/types/designer";
import PecaSketch, { PecaSketchHandle } from "./PecaSketch";

interface DesignerPreviewProps {
  peca: PecaDesignGerada;
  onSvgGenerated?: (svg: string) => void;
}

export interface DesignerPreviewHandle {
  generateSvg: () => void;
}

const DesignerPreview = forwardRef<DesignerPreviewHandle, DesignerPreviewProps>(
  function DesignerPreview({ peca, onSvgGenerated }, ref) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"sketch" | "ia">("sketch");
  const [svgContent, setSvgContent] = useState<string | null>(peca.svgSketch || null);
  const [generatingSvg, setGeneratingSvg] = useState(false);
  const [svgError, setSvgError] = useState<string | null>(null);
  const sketchRef = useRef<PecaSketchHandle>(null);

  function handleCopyPrompt() {
    navigator.clipboard.writeText(peca.promptImagem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadImage() {
    if (activeTab === "ia" && svgContent) {
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 1100;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#09090b";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const a = document.createElement("a");
          a.href = canvas.toDataURL("image/png");
          a.download = `${peca.nome.replace(/\s+/g, "_")}_ia_sketch.png`;
          a.click();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } else {
      const dataUrl = sketchRef.current?.exportImage();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${peca.nome.replace(/\s+/g, "_")}_sketch.png`;
      a.click();
    }
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }

  const handleGenerateSvg = useCallback(async () => {
    if (generatingSvg) return;
    setGeneratingSvg(true);
    setSvgError(null);
    setActiveTab("ia");
    try {
      const res = await fetch("/api/gerar-sketch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(peca),
      });

      if (!res.ok) {
        // Error responses are still JSON
        const data = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(data.error || "Erro ao gerar sketch");
      }

      // Response is streamed as plain text (SVG)
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Erro ao ler resposta");

      const decoder = new TextDecoder();
      let svg = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        svg += decoder.decode(value, { stream: true });
        // Show progressive SVG as it streams in
        if (svg.includes("</svg>")) {
          const match = svg.match(/<svg[\s\S]*<\/svg>/);
          if (match) setSvgContent(match[0]);
        }
      }

      svg = svg.trim();
      // Clean up any markdown wrapping
      if (svg.startsWith("```")) {
        svg = svg.replace(/^```(?:svg|xml)?\n?/, "").replace(/\n?```$/, "").trim();
      }
      // Validate and extract SVG
      if (!svg.startsWith("<svg")) {
        const svgMatch = svg.match(/<svg[\s\S]*<\/svg>/);
        if (svgMatch) {
          svg = svgMatch[0];
        } else {
          throw new Error("IA não gerou SVG válido");
        }
      }

      setSvgContent(svg);
      onSvgGenerated?.(svg);
    } catch (err) {
      setSvgError(err instanceof Error ? err.message : "Erro ao gerar sketch");
    } finally {
      setGeneratingSvg(false);
    }
  }, [peca, onSvgGenerated, generatingSvg]);

  useImperativeHandle(ref, () => ({
    generateSvg: handleGenerateSvg,
  }), [handleGenerateSvg]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/gerar-peca/salvar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...peca, svgSketch: svgContent }),
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
      {/* Tab toggle */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <div className="flex bg-zinc-800/60 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab("sketch")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === "sketch"
                ? "bg-purple-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sketch
          </button>
          <button
            onClick={() => setActiveTab("ia")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === "ia"
                ? "bg-purple-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            IA Sketch
          </button>
        </div>

        {activeTab === "ia" && (
          <button
            onClick={handleGenerateSvg}
            disabled={generatingSvg}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 transition-colors disabled:opacity-50"
          >
            {generatingSvg ? "Gerando..." : svgContent ? "Regenerar" : "Gerar"}
          </button>
        )}
      </div>

      {/* Preview area */}
      <div className="p-4">
        {activeTab === "sketch" ? (
          <PecaSketch ref={sketchRef} peca={peca} editable />
        ) : (
          <div className="relative">
            {svgContent ? (
              <div
                className="w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center min-h-[300px]"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : generatingSvg ? (
              <div className="w-full rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center min-h-[300px] gap-4">
                <div className="w-14 h-14 rounded-full gradient-bg pulse-glow flex items-center justify-center">
                  <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-zinc-400 text-sm animate-pulse">
                  Desenhando sketch único com IA...
                </p>
              </div>
            ) : (
              <div className="w-full rounded-xl bg-zinc-900 border border-zinc-800 border-dashed flex flex-col items-center justify-center min-h-[300px] gap-3">
                <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                <p className="text-zinc-500 text-sm text-center px-4">
                  Clique em &quot;Gerar&quot; para criar um sketch único com IA
                </p>
                <button
                  onClick={handleGenerateSvg}
                  disabled={generatingSvg}
                  className="px-4 py-2 rounded-xl text-sm font-medium gradient-bg text-white hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Gerar Sketch com IA
                </button>
              </div>
            )}
            {svgError && (
              <p className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">
                {svgError}
              </p>
            )}
          </div>
        )}
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
});

export default DesignerPreview;
