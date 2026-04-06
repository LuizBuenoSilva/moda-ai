"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoreSearchUrl } from "@/lib/store-urls";
import dynamic from "next/dynamic";
import type { PecaDesignGerada } from "@/types/designer";

const PecaSketch = dynamic(() => import("@/components/designer/PecaSketch"), { ssr: false });

interface LookSalvo {
  id: string;
  nome: string;
  descricao: string;
  estilo: string;
  ocasiao: string;
  genero: string | null;
  precoEstimado: number;
  cores: string;
  outfitJson: string;
  explicacao?: string;
  pastaId: string | null;
  createdAt: string;
  pecas: Array<{
    id: string;
    categoria: string;
    nome: string;
    descricao: string;
    cor: string;
    preco: number;
    tecido: string | null;
    corte: string | null;
    lojas?: string | null;
  }>;
}

interface DesignSalvo {
  id: string;
  nome: string;
  tipo: string;
  estilo: string;
  descricao: string;
  tecido: string;
  corte: string;
  textura: string;
  elementosVisuais: string;
  sugestaoUso: string;
  cores: string;
  inspiracao: string | null;
  promptImagem: string;
  pastaId: string | null;
  createdAt: string;
}

interface Pasta {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  _count: { looks: number; designs: number };
}

function parseLojas(lojasField: string | null | undefined): string[] {
  if (!lojasField) return [];
  try {
    const parsed = JSON.parse(lojasField);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return lojasField.split(",").map(l => l.trim()).filter(Boolean);
  }
}

const FOLDER_COLORS = ["#a855f7", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ColecaoPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"looks" | "designs">("looks");
  const [looks, setLooks] = useState<LookSalvo[]>([]);
  const [designs, setDesigns] = useState<DesignSalvo[]>([]);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLook, setExpandedLook] = useState<string | null>(null);
  const [selectedPasta, setSelectedPasta] = useState<string | null>(null);
  const [showNewPasta, setShowNewPasta] = useState(false);
  const [newPastaName, setNewPastaName] = useState("");
  const [newPastaColor, setNewPastaColor] = useState("#a855f7");
  const [movingItem, setMovingItem] = useState<{ id: string; type: "look" | "design" } | null>(null);
  const [expandedDesign, setExpandedDesign] = useState<DesignSalvo | null>(null);
  const [renamingPasta, setRenamingPasta] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function designToPeca(d: DesignSalvo): PecaDesignGerada {
    return {
      nome: d.nome,
      tipo: d.tipo,
      estilo: d.estilo,
      descricao: d.descricao,
      tecido: d.tecido,
      corte: d.corte,
      textura: d.textura || "",
      elementosVisuais: d.elementosVisuais || "",
      promptImagem: d.promptImagem,
      sugestaoUso: d.sugestaoUso || "",
      cores: JSON.parse(d.cores),
      inspiracao: d.inspiracao || undefined,
    };
  }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [looksRes, designsRes, pastasRes] = await Promise.all([
        fetch("/api/looks"),
        fetch("/api/designs"),
        fetch("/api/pastas"),
      ]);
      if (looksRes.ok) { const d = await looksRes.json(); setLooks(d.looks); }
      if (designsRes.ok) { const d = await designsRes.json(); setDesigns(d.designs); }
      if (pastasRes.ok) { const d = await pastasRes.json(); setPastas(d.pastas); }
    } finally { setLoading(false); }
  }

  async function handleCreatePasta() {
    if (!newPastaName.trim()) return;
    const res = await fetch("/api/pastas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: newPastaName, tipo: tab, cor: newPastaColor }),
    });
    if (res.ok) {
      const d = await res.json();
      setPastas(prev => [{ ...d.pasta, _count: { looks: 0, designs: 0 } }, ...prev]);
      setNewPastaName("");
      setShowNewPasta(false);
    }
  }

  async function handleRenamePasta(id: string, newName: string) {
    if (!newName.trim()) { setRenamingPasta(null); return; }
    const res = await fetch(`/api/pastas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", nome: newName.trim() }),
    });
    if (res.ok) {
      setPastas(prev => prev.map(p => p.id === id ? { ...p, nome: newName.trim() } : p));
    }
    setRenamingPasta(null);
  }

  async function handleDeletePasta(id: string) {
    if (!confirm("Excluir esta pasta? Os itens dentro dela não serão excluídos.")) return;
    const res = await fetch(`/api/pastas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPastas(prev => prev.filter(p => p.id !== id));
      if (selectedPasta === id) setSelectedPasta(null);
      // Refresh to clear pastaId from items
      fetchAll();
    }
  }

  async function handleMoveToFolder(pastaId: string) {
    if (!movingItem) return;
    const action = movingItem.type === "look" ? "addLook" : "addDesign";
    const body = movingItem.type === "look"
      ? { action, lookId: movingItem.id }
      : { action, designId: movingItem.id };
    await fetch(`/api/pastas/${pastaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMovingItem(null);
    fetchAll();
  }

  async function handleDeleteLook(id: string) {
    if (!confirm("Tem certeza que deseja excluir este look?")) return;
    const res = await fetch(`/api/looks/${id}`, { method: "DELETE" });
    if (res.ok) setLooks(prev => prev.filter(l => l.id !== id));
  }

  async function handleDeleteDesign(id: string) {
    if (!confirm("Tem certeza que deseja excluir este design?")) return;
    const res = await fetch(`/api/designs/${id}`, { method: "DELETE" });
    if (res.ok) setDesigns(prev => prev.filter(d => d.id !== id));
  }

  function handleViewAvatar(look: LookSalvo) {
    sessionStorage.setItem("avatarOutfit", look.outfitJson);
    sessionStorage.setItem("avatarLookName", look.nome);
    window.location.href = `/avatar?lookId=${look.id}&t=${Date.now()}`;
  }

  const filteredLooks = selectedPasta
    ? looks.filter(l => l.pastaId === selectedPasta)
    : looks;
  const filteredDesigns = selectedPasta
    ? designs.filter(d => d.pastaId === selectedPasta)
    : designs;
  const relevantPastas = pastas.filter(p => p.tipo === tab || p.tipo === "ambos");

  if (loading) {
    return (
      <div className="px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <div className="w-16 h-16 mx-auto rounded-full gradient-bg pulse-glow flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-zinc-400 mt-4">Carregando sua coleção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">
            <span className="gradient-text">Minha Coleção</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          <button onClick={() => { setTab("looks"); setSelectedPasta(null); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "looks" ? "gradient-bg text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"}`}>
            Looks ({looks.length})
          </button>
          <button onClick={() => { setTab("designs"); setSelectedPasta(null); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === "designs" ? "gradient-bg text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"}`}>
            Designs ({designs.length})
          </button>
        </div>

        {/* Folders bar */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPasta(null)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${!selectedPasta ? "bg-zinc-700 text-white" : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Todos
          </button>
          {relevantPastas.map(pasta => (
            <div key={pasta.id} className="shrink-0 flex items-center gap-1">
              {renamingPasta === pasta.id ? (
                <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-2 py-1 border border-zinc-600">
                  <input
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    className="bg-transparent text-sm text-zinc-200 outline-none w-28"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === "Enter") handleRenamePasta(pasta.id, renameValue);
                      if (e.key === "Escape") setRenamingPasta(null);
                    }}
                    onBlur={() => handleRenamePasta(pasta.id, renameValue)}
                  />
                  <button onClick={() => handleRenamePasta(pasta.id, renameValue)} className="text-green-400 hover:text-green-300 p-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedPasta(selectedPasta === pasta.id ? null : pasta.id)}
                  onDoubleClick={() => { setRenamingPasta(pasta.id); setRenameValue(pasta.nome); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${selectedPasta === pasta.id ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`}
                  style={{ backgroundColor: selectedPasta === pasta.id ? pasta.cor : undefined, border: `1px solid ${pasta.cor}40` }}
                  title="Duplo clique para renomear"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                  {pasta.nome}
                  <span className="text-xs opacity-60">({tab === "looks" ? pasta._count.looks : pasta._count.designs})</span>
                </button>
              )}
              <button onClick={() => { setRenamingPasta(pasta.id); setRenameValue(pasta.nome); }} className="text-zinc-600 hover:text-zinc-400 transition-colors p-1" title="Renomear">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => handleDeletePasta(pasta.id)} className="text-zinc-600 hover:text-red-400 transition-colors p-1" title="Excluir pasta">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          {!showNewPasta ? (
            <button onClick={() => setShowNewPasta(true)} className="shrink-0 px-3 py-2 rounded-lg text-sm bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 border border-dashed border-zinc-700 hover:border-zinc-500 transition-all flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Nova Pasta
            </button>
          ) : (
            <div className="shrink-0 flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5 border border-zinc-700">
              <input
                value={newPastaName}
                onChange={e => setNewPastaName(e.target.value)}
                placeholder="Nome da pasta..."
                className="bg-transparent text-sm text-zinc-200 outline-none w-32"
                autoFocus
                onKeyDown={e => { if (e.key === "Enter") handleCreatePasta(); if (e.key === "Escape") setShowNewPasta(false); }}
              />
              <div className="flex gap-1">
                {FOLDER_COLORS.map(c => (
                  <button key={c} onClick={() => setNewPastaColor(c)}
                    className={`w-4 h-4 rounded-full border-2 ${newPastaColor === c ? "border-white" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <button onClick={handleCreatePasta} className="text-green-400 hover:text-green-300 text-sm font-medium">Criar</button>
              <button onClick={() => setShowNewPasta(false)} className="text-zinc-500 hover:text-zinc-300 text-sm">✕</button>
            </div>
          )}
        </div>

        {/* Move to folder modal */}
        {movingItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setMovingItem(null)}>
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Mover para Pasta</h3>
              <div className="space-y-2">
                {relevantPastas.map(pasta => (
                  <button key={pasta.id} onClick={() => handleMoveToFolder(pasta.id)}
                    className="w-full px-4 py-3 rounded-xl text-left text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pasta.cor }} />
                    {pasta.nome}
                  </button>
                ))}
                {relevantPastas.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">Crie uma pasta primeiro</p>}
              </div>
              <button onClick={() => setMovingItem(null)} className="w-full mt-4 py-2 rounded-xl text-sm bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">Cancelar</button>
            </div>
          </div>
        )}

        {/* Expanded design modal */}
        {expandedDesign && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setExpandedDesign(null)}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">{expandedDesign.tipo} &bull; {expandedDesign.estilo}</span>
                  <h2 className="text-xl font-bold">{expandedDesign.nome}</h2>
                </div>
                <button onClick={() => setExpandedDesign(null)} className="p-2 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Sketch */}
                <div className="flex justify-center">
                  <PecaSketch peca={designToPeca(expandedDesign)} />
                </div>

                {/* Colors */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500">Cores:</span>
                  <div className="flex gap-2">
                    {JSON.parse(expandedDesign.cores).map((cor: string, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-xl border border-zinc-700 shadow-lg" style={{ backgroundColor: cor }} title={cor} />
                    ))}
                  </div>
                </div>

                {/* Technical details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Tecido</span>
                    <p className="text-sm text-zinc-200 mt-1">{expandedDesign.tecido}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Corte</span>
                    <p className="text-sm text-zinc-200 mt-1">{expandedDesign.corte}</p>
                  </div>
                  {expandedDesign.textura && (
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Textura</span>
                      <p className="text-sm text-zinc-200 mt-1">{expandedDesign.textura}</p>
                    </div>
                  )}
                  {expandedDesign.elementosVisuais && (
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider">Elementos</span>
                      <p className="text-sm text-zinc-200 mt-1">{expandedDesign.elementosVisuais}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-zinc-400 leading-relaxed">{expandedDesign.descricao}</p>

                {/* Usage suggestion */}
                {expandedDesign.sugestaoUso && (
                  <p className="text-sm text-zinc-400 italic border-l-2 border-purple-500 pl-3">{expandedDesign.sugestaoUso}</p>
                )}

                {/* Prompt */}
                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Prompt de Imagem</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(expandedDesign.promptImagem)}
                      className="text-xs px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs text-purple-300 font-mono leading-relaxed">{expandedDesign.promptImagem}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setExpandedDesign(null);
                      router.push(`/designer`);
                    }}
                    className="flex-1 py-3 rounded-xl text-sm font-medium gradient-bg text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Editar no Designer
                  </button>
                  <button
                    onClick={() => handleDeleteDesign(expandedDesign.id).then(() => setExpandedDesign(null))}
                    className="px-4 py-3 rounded-xl text-sm font-medium bg-zinc-800 text-red-400 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/30 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Looks Tab */}
        {tab === "looks" && (
          <>
            {filteredLooks.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <p className="text-zinc-500 mb-4">{selectedPasta ? "Nenhum look nesta pasta" : "Nenhum look salvo ainda"}</p>
                <button onClick={() => router.push("/estilista")} className="gradient-bg text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
                  Criar Meu Primeiro Look
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLooks.map((look) => {
                  const cores: string[] = JSON.parse(look.cores);
                  const isExpanded = expandedLook === look.id;
                  return (
                    <div key={look.id} className={`bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all ${isExpanded ? "md:col-span-2 lg:col-span-3" : ""}`}>
                      <div className="h-2 flex">
                        {cores.map((cor, i) => (<div key={i} className="flex-1" style={{ backgroundColor: cor }} />))}
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold">{look.nome}</h3>
                          <span className="text-sm font-bold text-green-400">R${look.precoEstimado.toFixed(0)}</span>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">{look.estilo}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-300">{look.ocasiao}</span>
                        </div>
                        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{look.descricao}</p>

                        {!isExpanded && (
                          <div className="space-y-1.5 mb-4">
                            {look.pecas.slice(0, 4).map((peca) => (
                              <div key={peca.id} className="flex items-center gap-2 text-sm">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: peca.cor }} />
                                <span className="text-zinc-300 truncate">{peca.nome}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {isExpanded && (
                          <div className="space-y-4 mb-6">
                            {look.pecas.map((peca) => {
                              const lojas = parseLojas(peca.lojas);
                              return (
                                <div key={peca.id} className="bg-zinc-800/50 rounded-xl p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded-full mt-0.5 shrink-0 border border-zinc-600" style={{ backgroundColor: peca.cor }} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-baseline justify-between gap-2">
                                        <span className="text-sm font-semibold text-zinc-200">{peca.nome}</span>
                                        <span className="text-sm text-green-400 font-medium shrink-0">R${peca.preco.toFixed(0)}</span>
                                      </div>
                                      <p className="text-xs text-zinc-500 mt-1">{peca.descricao}</p>
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {peca.tecido && <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">{peca.tecido}</span>}
                                        {peca.corte && <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">{peca.corte}</span>}
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">{peca.categoria}</span>
                                      </div>
                                      {lojas.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                          <span className="text-xs text-zinc-600">Onde encontrar:</span>
                                          {lojas.map((loja, j) => (
                                            <a key={j} href={getStoreSearchUrl(loja, peca.nome)} target="_blank" rel="noopener noreferrer"
                                              className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/25 hover:border-purple-400/40 transition-colors cursor-pointer flex items-center gap-1">
                                              {loja}
                                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {look.explicacao && <p className="text-sm text-zinc-400 italic border-l-2 border-purple-500 pl-3">{look.explicacao}</p>}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => setExpandedLook(isExpanded ? null : look.id)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                            </svg>
                            {isExpanded ? "Recolher" : "Ver Detalhes"}
                          </button>
                          <button onClick={() => handleViewAvatar(look)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium gradient-bg text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                            </svg>
                            Avatar 3D
                          </button>
                          <button onClick={() => setMovingItem({ id: look.id, type: "look" })}
                            className="px-3 py-2.5 rounded-xl text-sm bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors border border-zinc-700"
                            title="Mover para pasta">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteLook(look.id)}
                            className="px-3 py-2.5 rounded-xl text-sm bg-zinc-800 text-red-400 hover:bg-red-500/20 transition-colors border border-zinc-700 hover:border-red-500/30">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Designs Tab */}
        {tab === "designs" && (
          <>
            {filteredDesigns.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                <p className="text-zinc-500 mb-4">{selectedPasta ? "Nenhum design nesta pasta" : "Nenhum design salvo ainda"}</p>
                <button onClick={() => router.push("/designer")} className="gradient-bg text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
                  Criar Meu Primeiro Design
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDesigns.map((design) => {
                  const cores: string[] = JSON.parse(design.cores);
                  return (
                    <div
                      key={design.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all cursor-pointer group"
                      onClick={() => setExpandedDesign(design)}
                    >
                      <div className="h-2 flex">
                        {cores.map((cor, i) => (<div key={i} className="flex-1" style={{ backgroundColor: cor }} />))}
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">{design.tipo} &bull; {design.estilo}</span>
                            <h3 className="text-lg font-bold mt-1 group-hover:text-purple-300 transition-colors">{design.nome}</h3>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{design.descricao}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{design.tecido}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{design.corte}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {cores.map((cor, i) => (<div key={i} className="w-6 h-6 rounded-lg border border-zinc-700" style={{ backgroundColor: cor }} />))}
                        </div>
                        <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setExpandedDesign(design)}
                            className="flex-1 py-2 rounded-xl text-sm font-medium gradient-bg text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Ver Sketch
                          </button>
                          <button onClick={() => navigator.clipboard.writeText(design.promptImagem)}
                            className="px-3 py-2 rounded-xl text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-colors"
                            title="Copiar prompt">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                          </button>
                          <button onClick={() => setMovingItem({ id: design.id, type: "design" })}
                            className="px-3 py-2 rounded-xl text-sm bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors border border-zinc-700"
                            title="Mover para pasta">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteDesign(design.id)}
                            className="px-3 py-2 rounded-xl text-sm bg-zinc-800 text-red-400 hover:bg-red-500/20 transition-colors border border-zinc-700 hover:border-red-500/30">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
