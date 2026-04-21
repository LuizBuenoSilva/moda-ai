"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onAvatarCreated: (url: string) => void;
  onClose: () => void;
}

export default function RPMCreator({ onAvatarCreated, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data) return;
      const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;

      // Avatar exported
      if (data?.source === "readyplayerme" && data?.eventName === "v1.avatar.exported") {
        const url: string = data.data;
        if (url?.includes("readyplayer.me")) {
          onAvatarCreated(url);
        }
      }
      // Frame ready
      if (data?.source === "readyplayerme" && data?.eventName === "v1.frame.ready") {
        setLoading(false);
        // Subscribe to events
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ target: "readyplayerme", type: "subscribe", eventName: "v1.avatar.exported" }),
          "*"
        );
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onAvatarCreated]);

  const rpmUrl =
    "https://readyplayer.me/avatar?frameApi&clearCache&bodyType=fullbody&language=pt";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900">
        <div>
          <h2 className="text-base font-semibold gradient-text">Criar Avatar 3D</h2>
          <p className="text-xs text-zinc-500">Personalize seu avatar realista</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
        >
          Fechar
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-bg pulse-glow flex items-center justify-center">
              <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-sm">Carregando criador de avatar...</p>
          </div>
        </div>
      )}

      {/* RPM Iframe */}
      <iframe
        ref={iframeRef}
        src={rpmUrl}
        className="flex-1 w-full border-0"
        allow="camera *; microphone *"
        onLoad={() => setLoading(false)}
        title="Ready Player Me Avatar Creator"
      />
    </div>
  );
}
