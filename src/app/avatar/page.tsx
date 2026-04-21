"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { OutfitJson } from "@/types/look";
import { outfitToParams, Outfit3DParams } from "@/lib/outfit-to-3d";
import { AvatarAppearance } from "@/components/avatar/AvatarModel";

const AvatarCanvas = dynamic(
  () => import("@/components/avatar/AvatarCanvas"),
  { ssr: false }
);

const DEFAULT_OUTFIT: OutfitJson = {
  top:    { type: "tshirt", color: "#6d28d9", material: "algodao", fit: "regular" },
  bottom: { type: "calca",  color: "#1e1e2e", material: "jeans",   fit: "slim"    },
  shoes:  { type: "tenis",  color: "#ffffff", material: "sintetico"               },
  accessories: [{ type: "relogio", color: "#c0c0c0" }],
};

function AvatarContent() {
  const searchParams = useSearchParams();
  const lookId    = searchParams.get("lookId");
  const timestamp = searchParams.get("t");

  const [outfitParams, setOutfitParams] = useState<Outfit3DParams | null>(null);
  const [lookName,  setLookName]  = useState("Avatar 3D");
  const [loading,   setLoading]   = useState(true);
  const [autoRotate,setAutoRotate]= useState(true);
  const [canvasKey, setCanvasKey] = useState(0);
  const [appearance,setAppearance]= useState<AvatarAppearance>({});
  const lastTimestamp = useRef<string | null>(null);

  // Load avatar appearance from profile
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/avatar-profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setAppearance({
              skinTone:   data.profile.skinTone   || undefined,
              hairColor:  data.profile.hairColor  || undefined,
              hairStyle:  data.profile.hairStyle  || undefined,
              bodyType:   data.profile.bodyType   || undefined,
              height:     data.profile.height     || undefined,
              shirtColor: data.profile.shirtColor || undefined,
              pantsColor: data.profile.pantsColor || undefined,
              shoeColor:  data.profile.shoeColor  || undefined,
            });
          }
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const applyOutfit = useCallback((outfit: OutfitJson, name?: string) => {
    setOutfitParams(outfitToParams(outfit));
    if (name) setLookName(name);
    setCanvasKey((k) => k + 1);
    try {
      sessionStorage.setItem("avatar_lastOutfit", JSON.stringify(outfit));
      if (name) sessionStorage.setItem("avatar_lastName", name);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (timestamp === lastTimestamp.current && lastTimestamp.current !== null) return;
    lastTimestamp.current = timestamp;
    setLoading(true);

    async function loadOutfit() {
      try {
        const storedOutfit = sessionStorage.getItem("avatarOutfit");
        const storedName   = sessionStorage.getItem("avatarLookName");
        if (storedOutfit) {
          applyOutfit(JSON.parse(storedOutfit), storedName || undefined);
          sessionStorage.removeItem("avatarOutfit");
          sessionStorage.removeItem("avatarLookName");
        } else if (lookId) {
          const res = await fetch(`/api/looks/${lookId}`);
          if (res.ok) {
            const data = await res.json();
            applyOutfit(JSON.parse(data.look.outfitJson), data.look.nome);
          } else {
            applyOutfit(DEFAULT_OUTFIT);
          }
        } else {
          const lastOutfit = sessionStorage.getItem("avatar_lastOutfit");
          const lastName   = sessionStorage.getItem("avatar_lastName");
          if (lastOutfit) {
            applyOutfit(JSON.parse(lastOutfit), lastName || undefined);
          } else {
            applyOutfit(DEFAULT_OUTFIT, "Look Padrão");
          }
        }
      } catch {
        applyOutfit(DEFAULT_OUTFIT);
      } finally {
        setLoading(false);
      }
    }
    loadOutfit();
  }, [lookId, timestamp, applyOutfit]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            <span className="gradient-text">{lookName}</span>
          </h1>
          <p className="text-sm text-zinc-500">Arraste para girar &bull; Scroll para zoom</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/conta"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personalizar Avatar
          </a>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              autoRotate
                ? "gradient-bg text-white"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
            }`}
          >
            {autoRotate ? "Rotação: ON" : "Rotação: OFF"}
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full gradient-bg pulse-glow flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        ) : (
          <AvatarCanvas
            key={canvasKey}
            outfitParams={outfitParams}
            autoRotate={autoRotate}
            appearance={appearance}
            rpmAvatarUrl={null}
          />
        )}
      </div>

      {/* Outfit color indicators */}
      {outfitParams && !loading && (
        <div className="px-6 py-3 border-t border-zinc-800 flex gap-4 overflow-x-auto">
          {[
            { color: outfitParams.top.color,    label: "Topo"    },
            { color: outfitParams.bottom.color, label: "Baixo"   },
            { color: outfitParams.shoes.color,  label: "Calçado" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className="w-4 h-4 rounded-full border border-zinc-700" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-zinc-400">{item.label}</span>
            </div>
          ))}
          {outfitParams.accessories.map((acc, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className="w-4 h-4 rounded-full border border-zinc-700" style={{ backgroundColor: acc.color }} />
              <span className="text-sm text-zinc-400">{acc.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AvatarPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="w-16 h-16 rounded-full gradient-bg pulse-glow flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      }
    >
      <AvatarContent />
    </Suspense>
  );
}
