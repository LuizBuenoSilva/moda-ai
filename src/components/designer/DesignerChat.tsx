"use client";

import { useState, useRef, useEffect } from "react";
import { PecaDesignGerada } from "@/types/designer";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DesignerChatProps {
  peca: PecaDesignGerada;
  onPecaUpdate: (peca: PecaDesignGerada) => void;
}

const QUICK_ACTIONS = [
  { label: "Preto e branco", prompt: "Mude as cores para preto e branco com design minimalista" },
  { label: "Tons terrosos", prompt: "Use cores terrosas como caramelo, bege e marrom" },
  { label: "Neon vibrante", prompt: "Cores neon vibrantes com visual chamativo" },
  { label: "Estilo streetwear", prompt: "Mude para estilo streetwear com estampa gráfica" },
  { label: "Mais elegante", prompt: "Torne mais elegante e sofisticado em seda" },
  { label: "Oversized", prompt: "Mude o corte para oversized solto e confortável" },
  { label: "Add bolsos", prompt: "Adicione bolsos cargo laterais ao design" },
  { label: "Bordados", prompt: "Adicione bordados artesanais com flores" },
  { label: "Estilo cyberpunk", prompt: "Mude para estilo cyberpunk com detalhes neon e zíperes" },
  { label: "Clean", prompt: "Simplifique o design para algo limpo e discreto" },
];

export default function DesignerChat({ peca, onPecaUpdate }: DesignerChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Design "${peca.nome}" criado! Me diga o que quer mudar — cores, tecido, estilo, detalhes... ou use os botões rápidos abaixo.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historico = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

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
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.peca) {
        onPecaUpdate(data.peca);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: "Desculpe, houve um erro. Tente novamente.",
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
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "gradient-bg text-white rounded-br-md"
                  : "bg-zinc-800 text-zinc-200 rounded-bl-md border border-zinc-700"
              }`}
            >
              {msg.content}
            </div>
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
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.prompt)}
              disabled={loading}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 hover:border-purple-500/40 transition-colors disabled:opacity-40"
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
