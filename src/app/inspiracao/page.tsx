"use client";

import { useState, useRef } from "react";
import { LookGerado } from "@/types/look";
import LookCard from "@/components/estilista/LookCard";

interface AnaliseResult {
  estilo: string;
  pecas: Array<{
    tipo: string;
    cor: string;
    material: string;
    descricao: string;
  }>;
  ocasiao: string;
  cores: string[];
  descricao: string;
  sugestoes: string;
}

export default function InspiracaoPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [orcamento, setOrcamento] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analise, setAnalise] = useState<AnaliseResult | null>(null);
  const [looks, setLooks] = useState<LookGerado[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageUrl("");
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleUrlChange(url: string) {
    setImageUrl(url);
    setImageFile(null);
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImageUrl("");
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleAnalyze() {
    if (!imageFile && !imageUrl) {
      setError("Envie uma imagem ou cole um link");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalise(null);
    setLooks([]);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append("image", imageFile);
      }
      if (imageUrl) {
        formData.append("imageUrl", imageUrl);
      }
      formData.append("orcamento", String(orcamento));

      const res = await fetch("/api/analisar-imagem", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(data.error || "Erro ao analisar");
      }

      const data = await res.json();
      setAnalise(data.analise);
      setLooks(data.looks);
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
            <span className="gradient-text">Inspiração por Imagem</span>
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Envie uma foto de roupa do Pinterest, Instagram ou qualquer lugar.
            A IA analisa o estilo e cria looks similares para você.
          </p>
        </div>

        {/* Upload Area */}
        <div className="max-w-2xl mx-auto mb-8">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
          >
            {imagePreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-80 mx-auto rounded-xl object-contain"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    setImageFile(null);
                    setImageUrl("");
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-white flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <svg className="w-12 h-12 mx-auto text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <p className="text-zinc-400 mb-1">Arraste uma imagem aqui ou clique para selecionar</p>
                <p className="text-xs text-zinc-600">PNG, JPG, WEBP até 10MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* URL Input */}
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-xs text-zinc-600 uppercase">ou cole um link</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://pinterest.com/pin/... ou link direto da imagem"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Budget */}
          <div className="mt-4">
            <label className="text-sm text-zinc-400 block mb-2">
              Orçamento para looks similares: <span className="text-white font-medium">R${orcamento}</span>
            </label>
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={orcamento}
              onChange={(e) => setOrcamento(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-zinc-600">
              <span>R$100</span>
              <span>R$2000</span>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || (!imageFile && !imageUrl)}
            className="w-full mt-6 py-4 rounded-xl font-semibold gradient-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analisando imagem...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Analisar e Criar Looks
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 rounded-full gradient-bg pulse-glow flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-zinc-400 animate-pulse">Analisando estilo e criando looks similares...</p>
          </div>
        )}

        {/* Analysis Result */}
        {analise && !loading && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800">
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                  Análise da IA
                </span>
                <h2 className="text-xl font-bold mt-1">
                  Estilo: <span className="gradient-text">{analise.estilo}</span>
                </h2>
                <p className="text-sm text-zinc-400 mt-2">{analise.descricao}</p>

                {/* Colors detected */}
                <div className="flex gap-2 mt-4">
                  {analise.cores.map((cor, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg border border-zinc-700"
                      style={{ backgroundColor: cor }}
                      title={cor}
                    />
                  ))}
                </div>
              </div>

              {/* Detected pieces */}
              <div className="p-6 border-b border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Peças Identificadas</h3>
                <div className="space-y-2">
                  {analise.pecas.map((peca, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border border-zinc-700 shrink-0"
                        style={{ backgroundColor: peca.cor }}
                      />
                      <div>
                        <span className="text-sm text-zinc-200">{peca.tipo}</span>
                        <span className="text-xs text-zinc-500 ml-2">{peca.material}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Sugestões da IA</h3>
                <p className="text-sm text-zinc-400 italic border-l-2 border-purple-500 pl-3">
                  {analise.sugestoes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Looks */}
        {looks.length > 0 && !loading && (
          <div>
            <h2 className="text-2xl font-bold text-center mb-8">
              <span className="gradient-text">Looks Inspirados</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {looks.map((look, i) => (
                <LookCard key={i} look={look} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
