"use client";

import { useState, useRef, useEffect, useMemo, Fragment } from "react";
import { PecaDesignGerada } from "@/types/designer";

interface ChatMsg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  mudancas?: string[];
  novaCores?: string[];
  prevCores?: string[];
}

interface DesignerChatProps {
  peca: PecaDesignGerada;
  onPecaUpdate: (peca: PecaDesignGerada) => void;
  onSketchRegenerate?: () => void;
  onSwitchToPreview?: () => void;
}

const VISUAL_FIELDS = ["cores", "elementosVisuais", "tipo", "estilo", "corte", "textura"];

const FIELD_LABELS: Record<string, { label: string; icon: string }> = {
  cores: { label: "Cores", icon: "🎨" },
  tecido: { label: "Tecido", icon: "🧵" },
  corte: { label: "Corte", icon: "✂️" },
  estilo: { label: "Estilo", icon: "✨" },
  elementosVisuais: { label: "Elementos", icon: "🔮" },
  tipo: { label: "Tipo", icon: "👕" },
  inspiracao: { label: "Inspiração", icon: "💡" },
  textura: { label: "Textura", icon: "🪄" },
};

function formatMessage(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) result.push(<br key={`br-${lineIdx}`} />);

    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        result.push(
          <strong key={`${lineIdx}-${partIdx}`} className="text-purple-300 font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      } else {
        result.push(<Fragment key={`${lineIdx}-${partIdx}`}>{part}</Fragment>);
      }
    });
  });

  return result;
}

function getQuickActions(peca: PecaDesignGerada): Array<{ label: string; prompt: string; isSketch?: boolean }> {
  const actions: Array<{ label: string; prompt: string; isSketch?: boolean }> = [
    { label: "✨ Surpreenda-me", prompt: "Surpreenda-me com um redesign completamente único e criativo que eu nunca imaginaria" },
    { label: "💡 Me dê ideias", prompt: "Me dê 3 ideias criativas e únicas para transformar essa peça em algo especial" },
    { label: "🎨 Gerar Sketch", prompt: "__GERAR_SKETCH__", isSketch: true },
  ];

  // Color-based suggestions
  const avgBrightness = peca.cores.reduce((sum, hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return sum + (r * 299 + g * 587 + b * 114) / 1000;
  }, 0) / peca.cores.length;

  if (avgBrightness < 100) {
    actions.push({ label: "☀️ Clarear", prompt: "Use cores mais claras e vibrantes mantendo o estilo" });
  } else {
    actions.push({ label: "🌙 Escurecer", prompt: "Use tons mais escuros e profundos mantendo a essência" });
  }

  // Style-based suggestions
  const estiloAtual = peca.estilo.toLowerCase();
  if (estiloAtual !== "minimalista") {
    actions.push({ label: "🔲 Minimalista", prompt: "Simplifique para um design minimalista limpo e elegante" });
  }
  if (estiloAtual !== "streetwear") {
    actions.push({ label: "🔥 Streetwear", prompt: "Transforme em streetwear com estampa gráfica bold" });
  }
  if (estiloAtual !== "cyberpunk") {
    actions.push({ label: "⚡ Cyberpunk", prompt: "Mude para estilo cyberpunk com detalhes neon e zíperes" });
  }

  // Element-based suggestions
  const elementos = (peca.elementosVisuais || "").toLowerCase();
  if (!elementos.includes("bordado")) {
    actions.push({ label: "+Bordados", prompt: "Adicione bordados artesanais detalhados ao design" });
  }
  if (!elementos.includes("bolso")) {
    actions.push({ label: "+Bolsos", prompt: "Adicione bolsos cargo laterais funcionais ao design" });
  }

  // Fabric suggestions
  const tecido = (peca.tecido || "").toLowerCase();
  if (!tecido.includes("seda")) {
    actions.push({ label: "🪡 Em seda", prompt: "Mude o tecido para seda natural com brilho acetinado" });
  }
  if (!tecido.includes("couro")) {
    actions.push({ label: "🖤 Em couro", prompt: "Mude o tecido para couro ecológico texturizado" });
  }

  // Cut suggestions
  const corte = (peca.corte || "").toLowerCase();
  if (!corte.includes("oversized")) {
    actions.push({ label: "📐 Oversized", prompt: "Mude o corte para oversized solto e confortável" });
  }
  if (!corte.includes("cropped")) {
    actions.push({ label: "✂️ Cropped", prompt: "Transforme em corte cropped moderno" });
  }

  return actions.slice(0, 12);
}

export default function DesignerChat({ peca, onPecaUpdate, onSketchRegenerate, onSwitchToPreview }: DesignerChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Design "${peca.nome}" criado! Me diga o que quer mudar — cores, tecido, estilo, detalhes... ou use os botões rápidos abaixo.\n\nVocê pode pedir qualquer coisa: "faça manga longa", "mude para tons terrosos", "adicione bordados", ou até "surpreenda-me"!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions = useMemo(() => getQuickActions(peca), [peca]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    // Handle sketch generation action
    if (text === "__GERAR_SKETCH__") {
      onSketchRegenerate?.();
      onSwitchToPreview?.();
      setMessages((prev) => [
        ...prev,
        { id: `s-${Date.now()}`, role: "system", content: "🎨 Gerando novo sketch com IA..." },
      ]);
      return;
    }

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };

    const prevCores = [...peca.cores];

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historico = messages
        .filter((m) => m.id !== "welcome" && m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const res = await fetch("/api/designer-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pecaAtual: peca,
          instrucao: text.trim(),
          historico,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro na API");
      }

      const data = await res.json();

      const assistantMsg: ChatMsg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.resposta || "Design atualizado!",
        mudancas: data.mudancas || [],
        novaCores: data.peca?.cores,
        prevCores,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.peca) {
        onPecaUpdate(data.peca);

        // Auto-regenerate sketch if visual fields changed
        const mudancas: string[] = data.mudancas || [];
        const hasVisualChange = mudancas.some((m: string) => VISUAL_FIELDS.includes(m));
        if (hasVisualChange && onSketchRegenerate) {
          setTimeout(() => {
            onSketchRegenerate();
            setMessages((prev) => [
              ...prev,
              { id: `s-${Date.now()}`, role: "system", content: "🎨 Gerando novo sketch com as mudanças..." },
            ]);
          }, 600);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Desculpe, houve um erro ao processar. Tente novamente — se persistir, pode ser instabilidade temporária da IA.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 shrink-0">
        <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat com Designer IA
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "system" ? (
              <div className="flex justify-center">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-2 text-xs text-purple-300 text-center">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "gradient-bg text-white rounded-br-md"
                        : "bg-zinc-800 text-zinc-200 rounded-bl-md border border-zinc-700"
                    }`}
                  >
                    {formatMessage(msg.content)}
                  </div>

                  {/* Visual change indicators */}
                  {msg.role === "assistant" && msg.mudancas && msg.mudancas.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {/* Changed field tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {msg.mudancas.map((field) => {
                          const info = FIELD_LABELS[field];
                          if (!info) return null;
                          return (
                            <span
                              key={field}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-zinc-800/80 border-l-2 border-purple-500 text-zinc-300"
                            >
                              <span>{info.icon}</span>
                              <span>{info.label}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Color before/after */}
                      {msg.mudancas.includes("cores") && msg.prevCores && msg.novaCores && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <div className="flex gap-1">
                            {msg.prevCores.map((cor, i) => (
                              <div
                                key={`prev-${i}`}
                                className="w-4 h-4 rounded-full border border-zinc-600"
                                style={{ backgroundColor: cor }}
                                title={cor}
                              />
                            ))}
                          </div>
                          <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <div className="flex gap-1">
                            {msg.novaCores.map((cor, i) => (
                              <div
                                key={`new-${i}`}
                                className="w-4 h-4 rounded-full border border-zinc-600 ring-1 ring-purple-500/30"
                                style={{ backgroundColor: cor }}
                                title={cor}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View sketch button */}
                      {onSketchRegenerate && (
                        <button
                          onClick={() => {
                            onSketchRegenerate();
                            onSwitchToPreview?.();
                          }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/15 text-purple-300 hover:bg-purple-600/25 border border-purple-500/20 transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver sketch atualizado
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Refinando design...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 py-2 border-t border-zinc-800/50 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.prompt)}
              disabled={loading}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${
                action.isSketch
                  ? "bg-purple-600/20 text-purple-300 border-purple-500/30 hover:bg-purple-600/30"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:border-purple-500/40"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-zinc-800 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: muda as cores para tons terrosos..."
            disabled={loading}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-zinc-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl gradient-bg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
