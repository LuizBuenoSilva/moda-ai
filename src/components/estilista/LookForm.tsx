"use client";

import { useState } from "react";

const ESTILOS = [
  { value: "casual", label: "Casual" },
  { value: "streetwear", label: "Streetwear" },
  { value: "elegante", label: "Elegante" },
  { value: "esportivo", label: "Esportivo" },
  { value: "minimalista", label: "Minimalista" },
  { value: "boho", label: "Boho / Bohemian" },
  { value: "vintage", label: "Vintage / Retrô" },
  { value: "classico", label: "Clássico" },
  { value: "romantico", label: "Romântico" },
  { value: "grunge", label: "Grunge" },
  { value: "preppy", label: "Preppy" },
  { value: "urbano", label: "Urbano" },
];

const OCASIOES = [
  { value: "dia-a-dia", label: "Dia a Dia" },
  { value: "trabalho", label: "Trabalho / Escritório" },
  { value: "festa", label: "Festa / Balada" },
  { value: "encontro", label: "Encontro Romântico" },
  { value: "casamento", label: "Casamento / Formatura" },
  { value: "praia", label: "Praia / Verão" },
  { value: "inverno", label: "Dia Frio / Inverno" },
  { value: "academia", label: "Academia / Esporte" },
  { value: "viagem", label: "Viagem" },
  { value: "entrevista", label: "Entrevista de Emprego" },
];

interface LookFormProps {
  onSubmit: (data: {
    estilo: string;
    ocasiao: string;
    orcamento: number;
    genero?: string;
    preferencias?: string;
  }) => void;
  loading: boolean;
}

export default function LookForm({ onSubmit, loading }: LookFormProps) {
  const [estilo, setEstilo] = useState("casual");
  const [ocasiao, setOcasiao] = useState("dia-a-dia");
  const [orcamento, setOrcamento] = useState(500);
  const [genero, setGenero] = useState("");
  const [preferencias, setPreferencias] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      estilo,
      ocasiao,
      orcamento,
      genero: genero || undefined,
      preferencias: preferencias || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estilo */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Estilo Desejado
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

        {/* Ocasião */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Ocasião
          </label>
          <select
            value={ocasiao}
            onChange={(e) => setOcasiao(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {OCASIOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Orçamento */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Orçamento Máximo: <span className="text-purple-400 font-bold">R${orcamento}</span>
          </label>
          <input
            type="range"
            min={100}
            max={5000}
            step={50}
            value={orcamento}
            onChange={(e) => setOrcamento(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>R$100</span>
            <span>R$5.000</span>
          </div>
        </div>

        {/* Gênero */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Gênero (opcional)
          </label>
          <select
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Não especificar</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="unissex">Unissex</option>
          </select>
        </div>

        {/* Preferências */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Preferências Adicionais (opcional)
          </label>
          <textarea
            value={preferencias}
            onChange={(e) => setPreferencias(e.target.value)}
            placeholder="Ex: gosto de cores escuras, prefiro tecidos leves, quero algo com estampa floral..."
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
            Gerando Looks...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Gerar 3 Looks com IA
          </>
        )}
      </button>
    </form>
  );
}
