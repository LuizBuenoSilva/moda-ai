"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIAS = ["vestuario", "calcados", "acessorios", "bolsas", "outros"];
const CAT_LABEL: Record<string, string> = {
  vestuario: "Vestuário", calcados: "Calçados", acessorios: "Acessórios", bolsas: "Bolsas", outros: "Outros",
};
const CONDICOES = ["novo", "seminovo", "usado"];
const COND_LABEL: Record<string, string> = { novo: "Novo", seminovo: "Seminovo", usado: "Usado" };
const TAMANHOS = ["PP", "P", "M", "G", "GG", "XG", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "Único"];

export default function EditarAnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status } = useSession();
  const router = useRouter();

  const [titulo, setTitulo]       = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco]         = useState("");
  const [categoria, setCategoria] = useState("vestuario");
  const [tamanho, setTamanho]     = useState("");
  const [condicao, setCondicao]   = useState("novo");
  const [whatsapp, setWhatsapp]   = useState("");
  const [images, setImages]       = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/entrar"); return; }
    fetch(`/api/marketplace/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.listing) return;
        if (!d.listing.isMine) { router.replace(`/marketplace/${id}`); return; }
        setTitulo(d.listing.titulo);
        setDescricao(d.listing.descricao ?? "");
        setPreco(String(d.listing.preco));
        setCategoria(d.listing.categoria);
        setTamanho(d.listing.tamanho ?? "");
        setCondicao(d.listing.condicao);
        setWhatsapp(d.listing.whatsapp ?? "");
        setImages(d.listing.imageUrls ?? []);
      })
      .finally(() => setLoading(false));
  }, [id, status, router]);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const remaining = 5 - images.length;
    const toAdd = Math.min(files.length, remaining);
    Array.from(files).slice(0, toAdd).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setImages(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!titulo.trim()) return setError("Título é obrigatório");
    if (!preco || isNaN(Number(preco)) || Number(preco) <= 0) return setError("Preço inválido");
    if (images.length === 0) return setError("Adicione pelo menos uma foto");

    setSaving(true);
    const res = await fetch(`/api/marketplace/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descricao, preco: Number(preco), categoria, tamanho: tamanho || null, condicao, whatsapp, imageUrls: images }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erro ao salvar"); setSaving(false); return; }
    router.push(`/marketplace/${id}`);
  }

  if (loading) return <div className="px-4 py-8 text-center text-zinc-500">Carregando...</div>;

  return (
    <div className="px-4 py-8 pb-16 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/marketplace/${id}`} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold gradient-text">Editar Anúncio</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Fotos */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Fotos <span className="text-zinc-500">(até 5)</span></label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 hover:bg-red-500/80">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-purple-500/80 text-white px-1.5 rounded-full">capa</span>}
              </div>
            ))}
            {images.length < 5 && (
              <button type="button" onClick={() => inputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-purple-500/50 flex flex-col items-center justify-center gap-1 transition-colors bg-zinc-900">
                <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Título *</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Descrição</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Preço (R$) *</label>
            <input type="number" value={preco} onChange={e => setPreco(e.target.value)} min="0" step="0.01" className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Categoria</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors">
              {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tamanho</label>
            <select value={tamanho} onChange={e => setTamanho(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors">
              <option value="">Não se aplica</option>
              {TAMANHOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Condição</label>
            <select value={condicao} onChange={e => setCondicao(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors">
              {CONDICOES.map(c => <option key={c} value={c}>{COND_LABEL[c]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">WhatsApp <span className="text-zinc-500">(opcional)</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">+55</span>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ""))} maxLength={11} className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm outline-none focus:border-purple-500 transition-colors" />
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>
    </div>
  );
}
