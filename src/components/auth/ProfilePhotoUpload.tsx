"use client";

import { useRef, useState } from "react";
import { compressProfileImageFile } from "@/lib/compress-profile-image";

type Props = {
  photoDataUrl: string | null;
  onPhotoChange: (dataUrl: string | null) => void;
  disabled?: boolean;
};

export default function ProfilePhotoUpload({
  photoDataUrl,
  onPhotoChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const url = await compressProfileImageFile(file);
      onPhotoChange(url);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Erro ao processar imagem");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs text-zinc-500">Foto de perfil (opcional)</span>
      <div className="flex items-center gap-3">
        {photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoDataUrl}
            alt=""
            className="w-14 h-14 rounded-full object-cover border border-zinc-600 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-zinc-800 border border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 text-[10px] text-center px-1 shrink-0">
            sem foto
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onFile}
            disabled={disabled || busy}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || busy}
            className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 border border-zinc-600 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 w-fit"
          >
            {busy ? "Processando…" : photoDataUrl ? "Trocar foto" : "Escolher arquivo"}
          </button>
          {photoDataUrl && (
            <button
              type="button"
              onClick={() => onPhotoChange(null)}
              className="text-xs text-zinc-500 hover:text-zinc-300 w-fit"
            >
              Remover
            </button>
          )}
        </div>
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}
