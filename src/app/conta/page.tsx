"use client";

import { useEffect, useState, useRef } from "react";
import ProfilePhotoUpload from "@/components/auth/ProfilePhotoUpload";
import { compressProfileImageFile } from "@/lib/compress-profile-image";

type HomeLook = {
  id: string;
  nome: string;
  descricao: string | null;
  imageUrl: string | null;
  tags: string | null;
};

export default function ContaPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [homeLooks, setHomeLooks] = useState<HomeLook[]>([]);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState({
    skinTone: "",
    hairStyle: "",
    hairColor: "",
    bodyType: "",
    height: "",
    shirtColor: "",
    pantsColor: "",
    shoeColor: "",
  });

  // Home look form state
  const [lookNome, setLookNome] = useState("");
  const [lookDesc, setLookDesc] = useState("");
  const [lookTags, setLookTags] = useState("");
  const [lookPhoto, setLookPhoto] = useState<string | null>(null);
  const [lookPhotoProcessing, setLookPhotoProcessing] = useState(false);
  const [lookPhotoError, setLookPhotoError] = useState<string | null>(null);
  const [savingLook, setSavingLook] = useState(false);
  const lookFileRef = useRef<HTMLInputElement>(null);

  // Expanded look card
  const [expandedLook, setExpandedLook] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [meRes, looksRes, avatarRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/home-looks"),
        fetch("/api/avatar-profile"),
      ]);
      if (meRes.ok) {
        const d = await meRes.json();
        setName(d.user?.name ?? "");
        setEmail(d.user?.email ?? "");
        setImage(d.user?.image ?? "");
      }
      if (looksRes.ok) {
        const d = await looksRes.json();
        setHomeLooks(d.looks ?? []);
      }
      if (avatarRes.ok) {
        const d = await avatarRes.json();
        if (d.profile) {
          setAvatar({
            skinTone: d.profile.skinTone ?? "",
            hairStyle: d.profile.hairStyle ?? "",
            hairColor: d.profile.hairColor ?? "",
            bodyType: d.profile.bodyType ?? "",
            height: d.profile.height ?? "",
            shirtColor: d.profile.shirtColor ?? "",
            pantsColor: d.profile.pantsColor ?? "",
            shoeColor: d.profile.shoeColor ?? "",
          });
        }
      }
    })();
  }, []);

  async function saveProfile() {
    setSaving(true);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image: image || null }),
    });
    setSaving(false);
  }

  async function saveAvatar() {
    setSaving(true);
    await fetch("/api/avatar-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(avatar),
    });
    setSaving(false);
  }

  async function handleLookPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLookPhotoError(null);
    setLookPhotoProcessing(true);
    try {
      const dataUrl = await compressProfileImageFile(file);
      setLookPhoto(dataUrl);
    } catch (err) {
      setLookPhotoError(err instanceof Error ? err.message : "Erro ao processar imagem");
    } finally {
      setLookPhotoProcessing(false);
    }
  }

  async function addHomeLook() {
    if (!lookNome.trim()) return;
    setSavingLook(true);
    try {
      const payload = {
        nome: lookNome.trim(),
        descricao: lookDesc.trim() || null,
        imageUrl: lookPhoto || null,
        tags: lookTags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const res = await fetch("/api/home-looks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const d = await res.json();
        setHomeLooks((prev) => [d.look, ...prev]);
        setLookNome("");
        setLookDesc("");
        setLookTags("");
        setLookPhoto(null);
      }
    } finally {
      setSavingLook(false);
    }
  }

  async function deleteHomeLook(id: string) {
    const res = await fetch(`/api/home-looks?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setHomeLooks((prev) => prev.filter((l) => l.id !== id));
      if (expandedLook === id) setExpandedLook(null);
    }
  }

  function parseTags(tags: string | null): string[] {
    if (!tags) return [];
    try { return JSON.parse(tags); } catch { return []; }
  }

  return (
    <div className="px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Minha Conta</span>
        </h1>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-semibold">Perfil</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm" placeholder="Nome" />
          <input value={email} readOnly className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700 text-sm text-zinc-400" />
          <ProfilePhotoUpload
            photoDataUrl={image || null}
            onPhotoChange={(url) => setImage(url ?? "")}
            disabled={saving}
          />
          <button onClick={saveProfile} disabled={saving} className="px-4 py-2 rounded-xl gradient-bg text-white text-sm disabled:opacity-60">Salvar Perfil</button>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-semibold">Avatar Personalizado</h2>
          <p className="text-xs text-zinc-500">Essas informações personalizam seu avatar 3D na página de looks.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={avatar.skinTone}
              onChange={(e) => setAvatar((v) => ({ ...v, skinTone: e.target.value }))}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
            >
              <option value="">Tom de pele</option>
              <option value="claro">Claro</option>
              <option value="medio">Médio</option>
              <option value="moreno">Moreno</option>
              <option value="escuro">Escuro</option>
              <option value="negro">Negro</option>
            </select>
            <select
              value={avatar.hairStyle}
              onChange={(e) => setAvatar((v) => ({ ...v, hairStyle: e.target.value }))}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
            >
              <option value="">Estilo de cabelo</option>
              <option value="curto">Curto</option>
              <option value="longo">Longo</option>
              <option value="cacheado">Cacheado / Crespo</option>
              <option value="careca">Careca / Raspado</option>
            </select>
            <select
              value={avatar.hairColor}
              onChange={(e) => setAvatar((v) => ({ ...v, hairColor: e.target.value }))}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
            >
              <option value="">Cor do cabelo</option>
              <option value="preto">Preto</option>
              <option value="castanho">Castanho</option>
              <option value="loiro">Loiro</option>
              <option value="ruivo">Ruivo</option>
              <option value="branco">Branco / Grisalho</option>
              <option value="azul">Azul</option>
              <option value="rosa">Rosa</option>
              <option value="vermelho">Vermelho</option>
              <option value="roxo">Roxo</option>
            </select>
            <select
              value={avatar.bodyType}
              onChange={(e) => setAvatar((v) => ({ ...v, bodyType: e.target.value }))}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
            >
              <option value="">Tipo físico</option>
              <option value="magro">Magro / Esbelto</option>
              <option value="regular">Regular</option>
              <option value="musculoso">Musculoso / Atlético</option>
              <option value="largo">Plus Size / Robusto</option>
            </select>
            <select
              value={avatar.height}
              onChange={(e) => setAvatar((v) => ({ ...v, height: e.target.value }))}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm md:col-span-2"
            >
              <option value="">Altura / proporção</option>
              <option value="baixo">Baixo / Petite</option>
              <option value="medio">Médio</option>
              <option value="alto">Alto</option>
            </select>
          </div>
          <p className="text-xs text-zinc-500 pt-1">Roupas do avatar</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={avatar.shirtColor}
              onChange={(e) => setAvatar((v) => ({ ...v, shirtColor: e.target.value }))}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
            >
              <option value="">Cor da camisa</option>
              <option value="#8899bb">Azul acinzentado</option>
              <option value="#ffffff">Branco</option>
              <option value="#1a1a1a">Preto</option>
              <option value="#c8c8c8">Cinza claro</option>
              <option value="#4a4a4a">Cinza escuro</option>
              <option value="#b03030">Vermelho</option>
              <option value="#2060a0">Azul royal</option>
              <option value="#207050">Verde</option>
              <option value="#806000">Amarelo/Caramelo</option>
              <option value="#7030a0">Roxo</option>
              <option value="#c07030">Laranja</option>
            </select>
            <select
              value={avatar.pantsColor}
              onChange={(e) => setAvatar((v) => ({ ...v, pantsColor: e.target.value }))}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
            >
              <option value="">Cor da calça</option>
              <option value="#1e2640">Azul escuro (jeans)</option>
              <option value="#3a5080">Jeans médio</option>
              <option value="#1a1a1a">Preto</option>
              <option value="#4a4a4a">Cinza escuro</option>
              <option value="#808080">Cinza</option>
              <option value="#c8b060">Bege / Cáqui</option>
              <option value="#603018">Marrom</option>
              <option value="#ffffff">Branco</option>
            </select>
            <select
              value={avatar.shoeColor}
              onChange={(e) => setAvatar((v) => ({ ...v, shoeColor: e.target.value }))}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
            >
              <option value="">Cor do tênis/sapato</option>
              <option value="#e8e8e8">Branco</option>
              <option value="#1a1a1a">Preto</option>
              <option value="#808080">Cinza</option>
              <option value="#c8a060">Bege / Couro</option>
              <option value="#b03030">Vermelho</option>
              <option value="#2060a0">Azul</option>
              <option value="#207050">Verde</option>
              <option value="#f0a030">Laranja</option>
            </select>
          </div>
          <button onClick={saveAvatar} disabled={saving} className="px-4 py-2 rounded-xl gradient-bg text-white text-sm disabled:opacity-60">Salvar Avatar</button>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">Looks feitos em casa</h2>

          {/* Add look form */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={lookNome}
                onChange={(e) => setLookNome(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
                placeholder="Nome do look"
              />
              <div className="flex gap-2">
                <input
                  ref={lookFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleLookPhotoSelect}
                />
                <button
                  type="button"
                  onClick={() => lookFileRef.current?.click()}
                  disabled={lookPhotoProcessing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {lookPhotoProcessing ? "Processando..." : lookPhoto ? "Trocar foto" : "Enviar foto"}
                </button>
                {lookPhoto && (
                  <button
                    type="button"
                    onClick={() => setLookPhoto(null)}
                    className="px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            {/* Photo preview */}
            {lookPhoto && (
              <div className="relative w-full max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lookPhoto}
                  alt="Preview"
                  className="h-32 w-full object-cover rounded-xl border border-zinc-700"
                />
              </div>
            )}
            {lookPhotoError && <p className="text-xs text-red-400">{lookPhotoError}</p>}

            <input
              value={lookDesc}
              onChange={(e) => setLookDesc(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
              placeholder="Descrição"
            />
            <input
              value={lookTags}
              onChange={(e) => setLookTags(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
              placeholder="Tags separadas por vírgula (ex: casual, dia)"
            />
            <button
              onClick={addHomeLook}
              disabled={savingLook || !lookNome.trim()}
              className="w-full px-4 py-2.5 rounded-xl gradient-bg text-white text-sm font-medium disabled:opacity-60"
            >
              {savingLook ? "Salvando..." : "Salvar look de casa"}
            </button>
          </div>

          {/* Looks list */}
          <div className="space-y-2">
            {homeLooks.map((look) => {
              const isExpanded = expandedLook === look.id;
              const tags = parseTags(look.tags);
              return (
                <div
                  key={look.id}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-xl overflow-hidden transition-all"
                >
                  {/* Collapsed header - always visible */}
                  <button
                    onClick={() => setExpandedLook(isExpanded ? null : look.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {look.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={look.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-zinc-600 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{look.nome}</p>
                        {tags.length > 0 && (
                          <div className="flex gap-1 mt-0.5">
                            {tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300">
                                {tag}
                              </span>
                            ))}
                            {tags.length > 3 && (
                              <span className="text-[10px] text-zinc-500">+{tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-zinc-700/50">
                      {look.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={look.imageUrl}
                          alt={look.nome}
                          className="mt-3 w-full max-h-80 object-contain rounded-xl border border-zinc-700 bg-zinc-900"
                        />
                      )}
                      {look.descricao && (
                        <p className="text-sm text-zinc-400">{look.descricao}</p>
                      )}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => deleteHomeLook(look.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Excluir look
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {homeLooks.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">Nenhum look salvo ainda. Adicione seu primeiro look acima!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
