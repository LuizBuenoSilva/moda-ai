"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ListingCard {
  id: string;
  titulo: string;
  preco: number;
  categoria: string;
  tamanho: string | null;
  condicao: string;
  status: string;
  thumbUrl: string | null;
  vendedorNome: string;
  hasWhatsapp: boolean;
  isMine: boolean;
  createdAt: string;
}

const CATEGORIAS = ["Todos", "vestuario", "calcados", "acessorios", "bolsas", "outros"];
const CONDICOES  = ["Todos", "novo", "seminovo", "usado"];
const CAT_LABEL: Record<string, string> = {
  vestuario: "Vestuário", calcados: "Calçados", acessorios: "Acessórios", bolsas: "Bolsas", outros: "Outros",
};
const COND_LABEL: Record<string, string> = { novo: "Novo", seminovo: "Seminovo", usado: "Usado" };
const COND_COLOR: Record<string, string> = {
  novo: "text-emerald-400 bg-emerald-500/15",
  seminovo: "text-yellow-400 bg-yellow-500/15",
  usado: "text-zinc-400 bg-zinc-500/15",
};

function Card({ item }: { item: ListingCard }) {
  return (
    <Link href={`/marketplace/${item.id}`} className="group block">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all hover:-translate-y-0.5">
        {/* Foto */}
        <div className="aspect-[3/4] bg-zinc-800 overflow-hidden relative">
          {item.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbUrl} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
          {item.status === "vendido" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full rotate-[-15deg]">VENDIDO</span>
            </div>
          )}
          <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${COND_COLOR[item.condicao] ?? "text-zinc-400 bg-zinc-700"}`}>
            {COND_LABEL[item.condicao] ?? item.condicao}
          </span>
          {item.tamanho && (
            <span className="absolute top-2 right-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded-full">{item.tamanho}</span>
          )}
        </div>
        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-semibold text-zinc-100 truncate">{item.titulo}</p>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{item.vendedorNome}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-base font-bold text-purple-400">
              {item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
            {item.hasWhatsapp && (
              <span title="Aceita contato via WhatsApp">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.531 5.858L.044 23.293a.75.75 0 00.916.916l5.435-1.487A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.733 9.733 0 01-4.98-1.37l-.358-.21-3.717 1.015 1.015-3.717-.21-.358A9.733 9.733 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MarketplacePage() {
  const { status } = useSession();
  const [listings, setListings]     = useState<ListingCard[]>([]);
  const [loading, setLoading]       = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categoria, setCategoria]   = useState("Todos");
  const [condicao, setCondicao]     = useState("Todos");
  const [q, setQ]                   = useState("");
  const [search, setSearch]         = useState("");

  const buildUrl = useCallback((cursor?: string) => {
    const p = new URLSearchParams();
    if (categoria !== "Todos") p.set("categoria", categoria);
    if (condicao  !== "Todos") p.set("condicao",  condicao);
    if (search) p.set("q", search);
    if (cursor)  p.set("cursor", cursor);
    return `/api/marketplace?${p}`;
  }, [categoria, condicao, search]);

  const fetchListings = useCallback(async (cursor?: string) => {
    const res  = await fetch(buildUrl(cursor));
    if (!res.ok) return;
    const data = await res.json();
    if (cursor) setListings(prev => [...prev, ...data.listings]);
    else        setListings(data.listings);
    setNextCursor(data.nextCursor);
  }, [buildUrl]);

  useEffect(() => {
    setLoading(true);
    fetchListings().finally(() => setLoading(false));
  }, [fetchListings]);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchListings(nextCursor);
    setLoadingMore(false);
  }

  return (
    <div className="px-4 py-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Marketplace</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Compre e venda peças entre a comunidade</p>
        </div>
        <div className="flex gap-2">
          {status === "authenticated" && (
            <Link href="/marketplace/minhas-pecas" className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-sm font-medium transition-colors">
              Meus anúncios
            </Link>
          )}
          <Link
            href={status === "authenticated" ? "/marketplace/novo" : "/entrar"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Vender peça
          </Link>
        </div>
      </div>

      {/* Busca + filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") setSearch(q); }}
            placeholder="Buscar peças..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors"
        >
          {CATEGORIAS.map(c => <option key={c} value={c}>{c === "Todos" ? "Todas categorias" : CAT_LABEL[c]}</option>)}
        </select>
        <select
          value={condicao}
          onChange={e => setCondicao(e.target.value)}
          className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors"
        >
          {CONDICOES.map(c => <option key={c} value={c}>{c === "Todos" ? "Qualquer condição" : COND_LABEL[c]}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-zinc-800" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🛍️</div>
          <p className="text-zinc-400 text-lg font-medium mb-2">Nenhuma peça encontrada</p>
          <p className="text-zinc-500 text-sm mb-6">Seja o primeiro a vender uma peça!</p>
          {status === "authenticated" && (
            <Link href="/marketplace/novo" className="px-6 py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity">
              Anunciar peça
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map(item => <Card key={item.id} item={item} />)}
          </div>
          {nextCursor && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loadingMore ? "Carregando..." : "Carregar mais"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
