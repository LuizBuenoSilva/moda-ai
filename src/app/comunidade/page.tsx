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

// ── Card ──────────────────────────────────────────────────────────────────────
function FeedCard({ item, onLike, onSave, onDelete }: {
  item: FeedItem;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors">
      {/* Photo */}
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.titulo}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
        {/* Author */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
            {item.userName.charAt(0).toUpperCase()}
          </div>
          <span className="text-white text-sm font-medium drop-shadow">{item.userName}</span>
        </div>
        {/* Delete button */}
        {item.isMine && (
          <button
            onClick={() => onDelete(item.id)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white hover:bg-red-500/80 transition-colors flex items-center justify-center"
            title="Excluir"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-zinc-100 text-sm leading-tight">{item.titulo}</h3>
        {item.descricao && (
          <p className={`text-xs text-zinc-400 mt-1 ${expanded ? "" : "line-clamp-2"}`}>
            {item.descricao}
          </p>
        )}
        {item.descricao && item.descricao.length > 80 && (
          <button onClick={() => setExpanded(v => !v)} className="text-xs text-purple-400 mt-0.5">
            {expanded ? "ver menos" : "ver mais"}
          </button>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.map((t, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-800">
          {/* Like */}
          <button
            onClick={() => onLike(item.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${item.curtido ? "text-pink-400" : "text-zinc-500 hover:text-pink-400"}`}
          >
            <svg className="w-4 h-4" fill={item.curtido ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span>{item.curtidas}</span>
          </button>

          {/* Save */}
          <button
            onClick={() => onSave(item.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${item.salvo ? "text-purple-400" : "text-zinc-500 hover:text-purple-400"}`}
          >
            <svg className="w-4 h-4" fill={item.salvo ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z" />
            </svg>
            <span>{item.salvos}</span>
          </button>

          <span className="ml-auto text-xs text-zinc-600">
            {new Date(item.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>
    </div>
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
    const dataUrl = await resizeImage(file, 900, 0.82);
    setPreview(dataUrl);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags(prev => [...prev, t]);
    }
    setTagInput("");
  }

  async function handlePublish() {
    if (!preview) { setError("Adicione uma foto"); return; }
    if (!titulo.trim()) { setError("Adicione um título"); return; }
    setPublishing(true);
    setError(null);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Compartilhar look</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Photo */}
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={async e => { const f = e.target.files?.[0]; if (f) await handleFile(f); e.target.value = ""; }} />

          {preview ? (
            <div className="relative rounded-xl overflow-hidden aspect-[3/4] bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setPreview(null); if (inputRef.current) inputRef.current.value = ""; }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-red-500/80 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-[3/4] max-h-64 rounded-xl border-2 border-dashed border-zinc-700 hover:border-purple-500/60 transition-colors flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-zinc-300"
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-sm">Clique para adicionar foto</span>
            </button>
          )}

          {/* Title */}
          <input
            value={titulo} onChange={e => setTitulo(e.target.value)}
            placeholder="Título do look *"
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500"
          />

          {/* Description */}
          <textarea
            value={descricao} onChange={e => setDescricao(e.target.value)}
            placeholder="Descrição (opcional) — marcas, onde comprou, dicas..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500 resize-none"
          />

          {/* Tags */}
          <div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                placeholder="Tags (ex: streetwear, verão)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500"
              />
              <button onClick={addTag} className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white text-sm">+</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    #{t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-white">×</button>
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
            {publishing ? "Publicando..." : "Publicar look"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ComunidadePage() {
  const { status } = useSession();
  const [looks, setLooks] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  async function handleLike(id: string) {
    if (status !== "authenticated") return;
    const res = await fetch(`/api/feed/${id}/like`, { method: "POST" });
    if (!res.ok) return;
    const { curtido } = await res.json();
    setLooks(prev => prev.map(l => l.id === id
      ? { ...l, curtido, curtidas: l.curtidas + (curtido ? 1 : -1) }
      : l
    ));
  }

  async function handleSave(id: string) {
    if (status !== "authenticated") return;
    const res = await fetch(`/api/feed/${id}/save`, { method: "POST" });
    if (!res.ok) return;
    const { salvo } = await res.json();
    setLooks(prev => prev.map(l => l.id === id
      ? { ...l, salvo, salvos: l.salvos + (salvo ? 1 : -1) }
      : l
    ));
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este look da comunidade?")) return;
    const res = await fetch(`/api/feed/${id}`, { method: "DELETE" });
    if (res.ok) setLooks(prev => prev.filter(l => l.id !== id));
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchFeed(nextCursor);
    setLoadingMore(false);
  }

  return (
    <div className="px-4 py-10 lg:px-8">
      {showPublish && (
        <PublishModal
          onClose={() => setShowPublish(false)}
          onPublished={item => setLooks(prev => [item, ...prev])}
        />
      )}

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Comunidade</h1>
            <p className="text-zinc-400 text-sm mt-1">Looks compartilhados por pessoas reais</p>
          </div>
          {status === "authenticated" ? (
            <button
              onClick={() => setShowPublish(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Compartilhar look
            </button>
          ) : (
            <Link href="/entrar" className="px-5 py-2.5 rounded-xl gradient-bg text-white font-medium text-sm hover:opacity-90 transition-opacity">
              Entrar para participar
            </Link>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-zinc-800" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : looks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">👗</div>
            <p className="text-zinc-400 text-lg font-medium mb-2">Nenhum look compartilhado ainda</p>
            <p className="text-zinc-500 text-sm mb-6">Seja o primeiro a compartilhar um look com a comunidade!</p>
            {status === "authenticated" && (
              <button onClick={() => setShowPublish(true)} className="px-6 py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity">
                Compartilhar meu primeiro look
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {looks.map(item => (
                <FeedCard key={item.id} item={item} onLike={handleLike} onSave={handleSave} onDelete={handleDelete} />
              ))}
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
    </div>
  );
}
