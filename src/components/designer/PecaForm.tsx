"use client";

import { useState } from "react";

const TIPOS = [
  { value: "camiseta", label: "Camiseta" },
  { value: "camisa", label: "Camisa" },
  { value: "jaqueta", label: "Jaqueta" },
  { value: "moletom", label: "Moletom / Hoodie" },
  { value: "blazer", label: "Blazer" },
  { value: "vestido", label: "Vestido" },
  { value: "calca", label: "Calça" },
  { value: "shorts", label: "Shorts" },
  { value: "saia", label: "Saia" },
  { value: "tenis", label: "Tênis" },
  { value: "bota", label: "Bota" },
  { value: "bolsa", label: "Bolsa" },
  { value: "acessorio", label: "Acessório" },
];

const ESTILOS = [
  { value: "streetwear", label: "Streetwear" },
  { value: "minimalista", label: "Minimalista" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "vintage", label: "Vintage" },
  { value: "high-fashion", label: "High Fashion" },
  { value: "esportivo", label: "Esportivo" },
  { value: "boho", label: "Boho" },
  { value: "grunge", label: "Grunge" },
  { value: "futurista", label: "Futurista" },
  { value: "classico", label: "Clássico" },
];

interface PecaFormProps {
  onSubmit: (data: {
    tipo: string;
    estilo: string;
    inspiracao: string;
    cores: string;
    detalhes: string;
  }) => void;
  loading: boolean;
}

export default function PecaForm({ onSubmit, loading }: PecaFormProps) {
  const [tipo, setTipo] = useState("camiseta");
  const [estilo, setEstilo] = useState("streetwear");
  const [inspiracao, setInspiracao] = useState("");
  const [cores, setCores] = useState("");
  const [detalhes, setDetalhes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ tipo, estilo, inspiracao, cores, detalhes });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Tipo de Peça
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Estilo
          </label>
          <select
            value={estilo}
            onChange={(e) => setEstilo(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {ESTILOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Inspiração
          </label>
          <input
            type="text"
            value={inspiracao}
            onChange={(e) => setInspiracao(e.target.value)}
            placeholder="Ex: cultura japonesa, anos 90, natureza..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Cores Desejadas
          </label>
          <input
            type="text"
            value={cores}
            onChange={(e) => setCores(e.target.value)}
            placeholder="Ex: preto e neon, tons terrosos, azul marinho..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Detalhes Adicionais
          </label>
          <textarea
            value={detalhes}
            onChange={(e) => setDetalhes(e.target.value)}
            placeholder="Ex: quero bolsos grandes, zíper aparente, estampa geométrica, tecido sustentável..."
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder:text-zinc-600"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full gradient-bg text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Criando Conceito...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128z" />
            </svg>
            Criar Conceito com IA
          </>
        )}
      </button>
    </form>
  );
}
