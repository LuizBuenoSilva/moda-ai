"use client";

import { useEffect, useState } from "react";

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
  });

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

  async function addHomeLook(formData: FormData) {
    const payload = {
      nome: String(formData.get("nome") ?? ""),
      descricao: String(formData.get("descricao") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const res = await fetch("/api/home-looks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const d = await res.json();
      setHomeLooks((prev) => [d.look, ...prev]);
    }
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
          <input value={image} onChange={(e) => setImage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm" placeholder="URL da foto de perfil (opcional)" />
          <button onClick={saveProfile} disabled={saving} className="px-4 py-2 rounded-xl gradient-bg text-white text-sm disabled:opacity-60">Salvar Perfil</button>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-lg font-semibold">Avatar Personalizado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={avatar.skinTone} onChange={(e) => setAvatar((v) => ({ ...v, skinTone: e.target.value }))} className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm" placeholder="Tom de pele" />
            <input value={avatar.hairStyle} onChange={(e) => setAvatar((v) => ({ ...v, hairStyle: e.target.value }))} className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm" placeholder="Estilo de cabelo" />
            <input value={avatar.hairColor} onChange={(e) => setAvatar((v) => ({ ...v, hairColor: e.target.value }))} className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm" placeholder="Cor do cabelo" />
            <input value={avatar.bodyType} onChange={(e) => setAvatar((v) => ({ ...v, bodyType: e.target.value }))} className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm" placeholder="Tipo físico" />
            <input value={avatar.height} onChange={(e) => setAvatar((v) => ({ ...v, height: e.target.value }))} className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm md:col-span-2" placeholder="Altura / proporção" />
          </div>
          <button onClick={saveAvatar} disabled={saving} className="px-4 py-2 rounded-xl gradient-bg text-white text-sm disabled:opacity-60">Salvar Avatar</button>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">Looks feitos em casa</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await addHomeLook(formData);
              e.currentTarget.reset();
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <input name="nome" required className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm" placeholder="Nome do look" />
            <input name="imageUrl" className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm" placeholder="URL da foto (opcional)" />
            <input name="descricao" className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm md:col-span-2" placeholder="Descrição" />
            <input name="tags" className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm md:col-span-2" placeholder="Tags separadas por vírgula (ex: casual, dia)" />
            <button className="px-4 py-2 rounded-xl gradient-bg text-white text-sm md:col-span-2">Salvar look de casa</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {homeLooks.map((look) => (
              <div key={look.id} className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
                <p className="font-medium">{look.nome}</p>
                {look.descricao && <p className="text-sm text-zinc-400">{look.descricao}</p>}
                {look.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={look.imageUrl} alt={look.nome} className="mt-2 h-36 w-full object-cover rounded-lg border border-zinc-700" />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
