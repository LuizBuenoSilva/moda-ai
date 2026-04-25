"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  titulo: string;
  descricao?: string | null;
  tags: string[];
  curtidas: number;
  salvos: number;
  curtido: boolean;
  salvo: boolean;
  isMine: boolean;
  createdAt: string;
}

// ── Resize helper ─────────────────────────────────────────────────────────────
function resizeImage(file: File, maxPx: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}sem`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ── Card estilo Instagram ─────────────────────────────────────────────────────
function FeedCard({ item, onLike, onSave, onDelete }: {
  item: FeedItem;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [doubleTapLike, setDoubleTapLike] = useState(false);
  const lastTapRef = useRef(0);

  function handleImageTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap → like
      if (!item.curtido) onLike(item.id);
      setDoubleTapLike(true);
      setTimeout(() => setDoubleTapLike(false), 900);
    }
    lastTapRef.current = now;
  }

  const short = (item.descricao ?? "").length > 120;

  return (
    <article className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold shrink-0">
          {item.userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{item.userName}</p>
          <p className="text-xs text-zinc-500">{timeAgo(item.createdAt)}</p>
        </div>
        {item.isMine && (
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Excluir look"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Foto ── */}
      <div
        className="relative w-full aspect-square overflow-hidden bg-zinc-800 cursor-pointer select-none"
        onClick={handleImageTap}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.titulo}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Coração de double-tap */}
        {doubleTapLike && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className="w-24 h-24 text-white drop-shadow-lg animate-ping-once"
              fill="currentColor" viewBox="0 0 24 24"
            >
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>
        )}
      </div>

      {/* ── Ações ── */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-4">
        {/* Curtir */}
        <button
          onClick={() => onLike(item.id)}
          className={`transition-all active:scale-90 ${item.curtido ? "text-pink-400" : "text-zinc-400 hover:text-pink-400"}`}
          aria-label="Curtir"
        >
          <svg className="w-6 h-6" fill={item.curtido ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Salvar */}
        <button
          onClick={() => onSave(item.id)}
          className={`ml-auto transition-all active:scale-90 ${item.salvo ? "text-purple-400" : "text-zinc-400 hover:text-purple-400"}`}
          aria-label="Salvar"
        >
          <svg className="w-6 h-6" fill={item.salvo ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z" />
          </svg>
        </button>
      </div>

      {/* ── Contadores ── */}
      <div className="px-4 pb-1">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {item.curtidas > 0 && (
            <span className="font-medium text-zinc-300">
              {item.curtidas} {item.curtidas === 1 ? "curtida" : "curtidas"}
            </span>
          )}
          {item.salvos > 0 && (
            <span>{item.salvos} {item.salvos === 1 ? "salvo" : "salvos"}</span>
          )}
        </div>
      </div>

      {/* ── Legenda ── */}
      <div className="px-4 pb-4">
        <p className="text-sm text-zinc-100 leading-relaxed">
          <span className="font-semibold mr-1.5">{item.userName}</span>
          {item.titulo}
        </p>
        {item.descricao && (
          <p className={`text-sm text-zinc-400 mt-0.5 leading-relaxed ${!expanded && short ? "line-clamp-2" : ""}`}>
            {item.descricao}
          </p>
        )}
        {item.descricao && short && (
          <button onClick={() => setExpanded(v => !v)} className="text-xs text-zinc-500 hover:text-zinc-300 mt-0.5">
            {expanded ? "ver menos" : "ver mais"}
          </button>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map((t, i) => (
              <span key={i} className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Publish modal ─────────────────────────────────────────────────────────────
function PublishModal({ onClose, onPublished }: { onClose: () => void; onPublished: (item: FeedItem) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const dataUrl = await resizeImage(file, 1080, 0.85);
    setPreview(dataUrl);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (t && !tags.includes(t) && tags.length < 5) setTags(prev => [...prev, t]);
    setTagInput("");
  }

  async function handlePublish() {
    if (!preview) { setError("Adicione uma foto"); return; }
    if (!titulo.trim()) { setError("Adicione um título"); return; }
    setPublishing(true); setError(null);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: preview, titulo, descricao, tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao publicar");
      onPublished(data.look);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Novo look</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={async e => { const f = e.target.files?.[0]; if (f) await handleFile(f); e.target.value = ""; }} />

          {preview ? (
            <div className="relative rounded-xl overflow-hidden aspect-square bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ""; }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-red-500/80 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={() => inputRef.current?.click()}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-zinc-600 transition-colors flex items-center justify-center"
                title="Trocar foto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-square max-h-72 rounded-xl border-2 border-dashed border-zinc-700 hover:border-purple-500/60 transition-colors flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-zinc-300"
            >
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Adicionar foto</span>
              <span className="text-xs text-zinc-600">JPG, PNG ou HEIC</span>
            </button>
          )}

          <input
            value={titulo} onChange={e => setTitulo(e.target.value)}
            placeholder="Título do look *"
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500 transition-colors"
          />

          <textarea
            value={descricao} onChange={e => setDescricao(e.target.value)}
            placeholder="Legenda — marcas, onde comprou, dicas..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500 resize-none transition-colors"
          />

          <div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                placeholder="Tags: streetwear, verão..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500 transition-colors"
              />
              <button onClick={addTag} className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors">+</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">
                    #{t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-white leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>}

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="w-full py-3 rounded-xl gradient-bg text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {publishing ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-zinc-800" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-zinc-800 rounded w-1/3" />
          <div className="h-2.5 bg-zinc-800 rounded w-1/5" />
        </div>
      </div>
      <div className="aspect-square bg-zinc-800" />
      <div className="px-4 py-4 space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-2/3" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ComunidadePage() {
  const { status } = useSession();
  const [tab, setTab] = useState<"feed" | "salvos">("feed");
  const [looks, setLooks] = useState<FeedItem[]>([]);
  const [salvos, setSalvos] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSalvos, setLoadingSalvos] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  const fetchFeed = useCallback(async (cursor?: string) => {
    const url = `/api/feed${cursor ? `?cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    if (cursor) {
      setLooks(prev => [...prev, ...data.looks]);
    } else {
      setLooks(data.looks);
    }
    setNextCursor(data.nextCursor);
  }, []);

  async function fetchSalvos() {
    setLoadingSalvos(true);
    try {
      const res = await fetch("/api/feed/saved");
      if (!res.ok) return;
      const data = await res.json();
      setSalvos(data.looks);
    } finally {
      setLoadingSalvos(false);
    }
  }

  useEffect(() => {
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  useEffect(() => {
    if (tab === "salvos" && status === "authenticated") fetchSalvos();
  }, [tab, status]);

  function updateItem(id: string, patch: Partial<FeedItem>) {
    setLooks(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    setSalvos(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }

  async function handleLike(id: string) {
    if (status !== "authenticated") return;
    const res = await fetch(`/api/feed/${id}/like`, { method: "POST" });
    if (!res.ok) return;
    const { curtido } = await res.json();
    const item = [...looks, ...salvos].find(l => l.id === id);
    if (item) updateItem(id, { curtido, curtidas: item.curtidas + (curtido ? 1 : -1) });
  }

  async function handleSave(id: string) {
    if (status !== "authenticated") return;
    const res = await fetch(`/api/feed/${id}/save`, { method: "POST" });
    if (!res.ok) return;
    const { salvo } = await res.json();
    const item = [...looks, ...salvos].find(l => l.id === id);
    if (item) {
      updateItem(id, { salvo, salvos: item.salvos + (salvo ? 1 : -1) });
      // Remover dos salvos se dessalvou
      if (!salvo && tab === "salvos") setSalvos(prev => prev.filter(l => l.id !== id));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este look da comunidade?")) return;
    const res = await fetch(`/api/feed/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLooks(prev => prev.filter(l => l.id !== id));
      setSalvos(prev => prev.filter(l => l.id !== id));
    }
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchFeed(nextCursor);
    setLoadingMore(false);
  }

  const currentList = tab === "feed" ? looks : salvos;
  const isLoading = tab === "feed" ? loading : loadingSalvos;

  return (
    <div className="min-h-screen px-4 py-8 pb-16">
      {showPublish && (
        <PublishModal
          onClose={() => setShowPublish(false)}
          onPublished={item => setLooks(prev => [item, ...prev])}
        />
      )}

      {/* ── Header ── */}
      <div className="mx-auto max-w-[470px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Comunidade</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Looks compartilhados por pessoas reais</p>
          </div>
          {status === "authenticated" ? (
            <button
              onClick={() => setShowPublish(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Publicar
            </button>
          ) : (
            <Link href="/entrar" className="px-4 py-2 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 transition-opacity">
              Entrar
            </Link>
          )}
        </div>

        {/* ── Tabs ── */}
        {status === "authenticated" && (
          <div className="flex border-b border-zinc-800 mb-6">
            <button
              onClick={() => setTab("feed")}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                tab === "feed" ? "text-zinc-100 border-b-2 border-purple-500" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Para você
            </button>
            <button
              onClick={() => setTab("salvos")}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                tab === "salvos" ? "text-zinc-100 border-b-2 border-purple-500" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Salvos
            </button>
          </div>
        )}

        {/* ── Feed ── */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-20">
            {tab === "salvos" ? (
              <>
                <div className="text-5xl mb-4">🔖</div>
                <p className="text-zinc-400 text-base font-medium mb-2">Nenhum look salvo ainda</p>
                <p className="text-zinc-500 text-sm">Toque no ícone de marcador nos looks que quiser guardar</p>
                <button
                  onClick={() => setTab("feed")}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm font-medium transition-colors"
                >
                  Explorar looks
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">👗</div>
                <p className="text-zinc-400 text-base font-medium mb-2">Nenhum look ainda</p>
                <p className="text-zinc-500 text-sm mb-6">Seja o primeiro a compartilhar um look!</p>
                {status === "authenticated" && (
                  <button onClick={() => setShowPublish(true)} className="px-6 py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity">
                    Compartilhar meu look
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {currentList.map(item => (
                <FeedCard key={item.id} item={item} onLike={handleLike} onSave={handleSave} onDelete={handleDelete} />
              ))}
            </div>

            {tab === "feed" && nextCursor && (
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
    </div>
  );
}
