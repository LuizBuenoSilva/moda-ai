"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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

const STATUS_LABEL: Record<string, string> = { ativo: "Ativo", vendido: "Vendido", inativo: "Pausado" };
const STATUS_COLOR: Record<string, string> = {
  ativo:   "text-emerald-400 bg-emerald-500/15",
  vendido: "text-red-400 bg-red-500/15",
  inativo: "text-zinc-400 bg-zinc-500/15",
};

function MPConnectPanel() {
  const [connected, setConnected]   = useState<boolean | null>(null);
  const [mpUserId, setMpUserId]     = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const searchParams = useSearchParams();

  const mpParam = searchParams.get("mp");

  const loadStatus = useCallback(async () => {
    const res  = await fetch("/api/marketplace/mp-status");
    const data = await res.json();
    setConnected(data.connected);
    setMpUserId(data.mpUserId);
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  async function handleConnect() {
    setConnecting(true);
    const res  = await fetch("/api/marketplace/mp-connect");
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setConnecting(false);
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    await fetch("/api/marketplace/mp-status", { method: "DELETE" });
    setConnected(false);
    setMpUserId(null);
    setDisconnecting(false);
  }

  return (
    <div className={`rounded-2xl border p-4 mb-6 ${connected ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-900 border-zinc-800"}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* MP Logo inline SVG */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${connected ? "bg-emerald-500/20" : "bg-zinc-800"}`}>
            <svg className={`w-6 h-6 ${connected ? "text-emerald-400" : "text-zinc-400"}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-zinc-200 text-sm">
              {connected === null ? "Verificando..." : connected ? "Mercado Pago conectado" : "Conectar Mercado Pago"}
            </p>
            <p className="text-xs text-zinc-500">
              {connected
                ? `Conta #${mpUserId} · compras via Pix vão direto para você`
                : "Conecte sua conta para receber pagamentos Pix automaticamente"}
            </p>
          </div>
        </div>

        {connected === false && (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {connecting ? "Redirecionando..." : "Conectar conta"}
          </button>
        )}
        {connected === true && (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors disabled:opacity-50"
          >
            {disconnecting ? "..." : "Desconectar"}
          </button>
        )}
      </div>

      {/* Feedback do callback OAuth */}
      {mpParam === "connected" && (
        <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 rounded-lg px-3 py-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Conta conectada com sucesso! Agora você recebe pagamentos Pix direto.
        </div>
      )}
      {mpParam === "error" && (
        <div className="mt-3 text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Erro ao conectar. Tente novamente.
          </div>
          {searchParams.get("reason") && (
            <p className="mt-1 text-red-500/70 pl-6">Motivo: {searchParams.get("reason")}</p>
          )}
        </div>
      )}
      {mpParam === "not_configured" && (
        <div className="mt-3 text-xs text-zinc-500 bg-zinc-800 rounded-lg px-3 py-2">
          Integração com Mercado Pago ainda não configurada pelo administrador.
        </div>
      )}

      {/* Info sobre taxa */}
      {!connected && connected !== null && (
        <div className="mt-3 text-xs text-zinc-500 flex items-start gap-1.5">
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Taxa da plataforma: 5% por venda. O restante vai direto para sua conta Mercado Pago.
        </div>
      )}
    </div>
  );
}

export default function MinhasPecasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/entrar"); return; }
    if (status !== "authenticated") return;

    fetch("/api/marketplace?mine=true&limit=50")
      .then(r => r.json())
      .then(d => setListings(d.listings ?? []))
      .finally(() => setLoading(false));
  }, [status, router]);

  async function toggleStatus(id: string, current: string) {
    const next = current === "ativo" ? "inativo" : "ativo";
    const res  = await fetch(`/api/marketplace/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) setListings(prev => prev.map(l => l.id === id ? { ...l, status: next } : l));
  }

  async function deleteListing(id: string) {
    if (!confirm("Tem certeza que deseja excluir este anúncio?")) return;
    setDeleting(id);
    const res = await fetch(`/api/marketplace/${id}`, { method: "DELETE" });
    if (res.ok) {
      setListings(prev => prev.filter(l => l.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`Erro ao excluir: ${data.error ?? "tente novamente"}`);
    }
    setDeleting(null);
  }

  return (
    <div className="px-4 py-8 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Meus Anúncios</h1>
            <p className="text-zinc-500 text-sm">{listings.length} peça{listings.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Link href="/marketplace/novo" className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 transition-opacity">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo
        </Link>
      </div>

      {/* Painel MP Connect */}
      {status === "authenticated" && <MPConnectPanel />}

      {/* Lista de anúncios */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse flex gap-4">
              <div className="w-20 h-20 bg-zinc-800 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
                <div className="h-3 bg-zinc-800 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👗</div>
          <p className="text-zinc-400 text-lg font-medium mb-2">Nenhum anúncio ainda</p>
          <p className="text-zinc-500 text-sm mb-6">Comece vendendo suas peças!</p>
          <Link href="/marketplace/novo" className="px-6 py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity">
            Criar primeiro anúncio
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-4 hover:border-zinc-700 transition-colors">
              {/* Thumb */}
              <Link href={`/marketplace/${item.id}`} className="flex-shrink-0">
                <div className="w-20 h-20 bg-zinc-800 rounded-xl overflow-hidden">
                  {item.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbUrl} alt={item.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/marketplace/${item.id}`} className="font-semibold text-zinc-100 text-sm truncate hover:text-purple-300 transition-colors">
                    {item.titulo}
                  </Link>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[item.status] ?? STATUS_COLOR.inativo}`}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                </div>
                <p className="text-base font-bold text-purple-400 mt-0.5">
                  {item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Link href={`/marketplace/${item.id}/editar`} className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                    Editar
                  </Link>
                  {item.status !== "vendido" && (
                    <button onClick={() => toggleStatus(item.id, item.status)} className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                      {item.status === "ativo" ? "Pausar" : "Reativar"}
                    </button>
                  )}
                  <button onClick={() => deleteListing(item.id)} disabled={deleting === item.id} className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50">
                    {deleting === item.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
