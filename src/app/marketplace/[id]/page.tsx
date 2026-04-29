"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Listing {
  id: string;
  titulo: string;
  descricao: string | null;
  preco: number;
  categoria: string;
  tamanho: string | null;
  condicao: string;
  status: string;
  views: number;
  imageUrls: string[];
  whatsapp: string | null;
  vendedorId: string;
  vendedorNome: string;
  isMine: boolean;
  createdAt: string;
}

interface Msg {
  id: string;
  content: string;
  createdAt: string;
  fromUser: { id: string; name: string | null };
}

interface Conversation {
  userId: string;
  userName: string;
  unread: number;
}

const COND_COLOR: Record<string, string> = {
  novo: "text-emerald-400 bg-emerald-500/15",
  seminovo: "text-yellow-400 bg-yellow-500/15",
  usado: "text-zinc-400 bg-zinc-500/15",
};
const COND_LABEL: Record<string, string> = { novo: "Novo", seminovo: "Seminovo", usado: "Usado" };
const CAT_LABEL: Record<string, string> = {
  vestuario: "Vestuário", calcados: "Calçados", acessorios: "Acessórios", bolsas: "Bolsas", outros: "Outros",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// PixModal
function PixModal({ pixCode, pixQrCode, valor, onClose }: { pixCode: string; pixQrCode: string; valor: number; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(pixCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-zinc-100">Pagar com Pix</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-center text-2xl font-bold text-purple-400 mb-4">
          {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>

        {/* QR Code */}
        {pixQrCode && (
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code Pix" className="w-48 h-48 rounded-xl" />
          </div>
        )}

        <p className="text-xs text-zinc-500 text-center mb-3">Ou copie o código Pix:</p>

        <div className="bg-zinc-800 rounded-xl p-3 text-xs text-zinc-400 break-all mb-3 max-h-20 overflow-y-auto">
          {pixCode}
        </div>

        <button
          onClick={copy}
          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
        >
          {copied ? "✓ Copiado!" : "Copiar código Pix"}
        </button>

        <p className="text-xs text-zinc-500 text-center mt-3">
          Após o pagamento, o anúncio será marcado como vendido automaticamente.
        </p>
      </div>
    </div>
  );
}

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [listing, setListing]   = useState<Listing | null>(null);
  const [loading, setLoading]   = useState(true);
  const [imgIdx, setImgIdx]     = useState(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [convos, setConvos]     = useState<Conversation[]>([]);
  const [isSeller, setIsSeller] = useState(false);
  const [selBuyer, setSelBuyer] = useState<string | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [pixData, setPixData]   = useState<{ pixCode: string; pixQrCode: string; valor: number } | null>(null);
  const [buyError, setBuyError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/marketplace/${id}`)
      .then(r => r.json())
      .then(d => setListing(d.listing))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (status !== "authenticated" || !chatOpen) return;
    loadMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, chatOpen, selBuyer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    setLoadingMsgs(true);
    const url = selBuyer ? `/api/marketplace/${id}/messages?buyerId=${selBuyer}` : `/api/marketplace/${id}/messages`;
    const res = await fetch(url);
    const data = await res.json();
    setMessages(data.messages ?? []);
    setConvos(data.conversations ?? []);
    setIsSeller(data.isSeller ?? false);
    setLoadingMsgs(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgInput.trim() || sendingMsg) return;
    setSendingMsg(true);
    const res = await fetch(`/api/marketplace/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: msgInput, toUserId: selBuyer }),
    });
    const data = await res.json();
    if (data.message) {
      setMessages(prev => [...prev, data.message]);
      setMsgInput("");
    }
    setSendingMsg(false);
  }

  async function handleBuy() {
    if (!session) { router.push("/entrar"); return; }
    setBuyLoading(true);
    setBuyError("");
    const res  = await fetch(`/api/marketplace/${id}/buy`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setPixData({ pixCode: data.order.pixCode, pixQrCode: data.order.pixQrCode, valor: data.order.valor });
    } else if (data.error === "pagamento_nao_configurado") {
      // Redirecionar para WhatsApp se disponível
      if (listing?.whatsapp) {
        const wa = `https://wa.me/55${listing.whatsapp}?text=${encodeURIComponent(`Olá! Tenho interesse na peça "${listing.titulo}" anunciada na Yuzo.`)}`;
        window.open(wa, "_blank");
      } else {
        setChatOpen(true);
      }
    } else {
      setBuyError(data.error ?? "Erro ao iniciar pagamento");
    }
    setBuyLoading(false);
  }

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto animate-pulse">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-zinc-900 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-zinc-900 rounded w-3/4" />
            <div className="h-8 bg-zinc-900 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-zinc-400">Anúncio não encontrado.</p>
        <Link href="/marketplace" className="mt-4 text-purple-400 hover:underline text-sm">Voltar ao marketplace</Link>
      </div>
    );
  }

  const whatsappUrl = listing.whatsapp
    ? `https://wa.me/55${listing.whatsapp}?text=${encodeURIComponent(`Olá! Tenho interesse na peça "${listing.titulo}" anunciada na Yuzo.`)}`
    : null;

  return (
    <div className="px-4 py-8 pb-16 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Marketplace
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Galeria */}
        <div>
          <div className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden relative">
            {listing.imageUrls.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.imageUrls[imgIdx]}
                alt={listing.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
            {listing.status === "vendido" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="bg-red-500 text-white text-lg font-bold px-6 py-2 rounded-full rotate-[-15deg]">VENDIDO</span>
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {listing.imageUrls.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {listing.imageUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? "border-purple-500" : "border-transparent"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-zinc-100 leading-tight">{listing.titulo}</h1>
            {listing.isMine && (
              <Link href={`/marketplace/${id}/editar`} className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors">
                Editar
              </Link>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COND_COLOR[listing.condicao] ?? "text-zinc-400 bg-zinc-700"}`}>
              {COND_LABEL[listing.condicao] ?? listing.condicao}
            </span>
            {listing.tamanho && (
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
                Tam. {listing.tamanho}
              </span>
            )}
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full">
              {CAT_LABEL[listing.categoria] ?? listing.categoria}
            </span>
          </div>

          <p className="text-3xl font-bold text-purple-400 mt-4">
            {listing.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>

          {/* Vendedor */}
          <div className="flex items-center gap-2 mt-4 pb-4 border-b border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold text-white">
              {listing.vendedorNome.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">{listing.vendedorNome}</p>
              <p className="text-xs text-zinc-500">{listing.views} visualizações · {timeAgo(listing.createdAt)} atrás</p>
            </div>
          </div>

          {/* Descrição */}
          {listing.descricao && (
            <div className="mt-4 pb-4 border-b border-zinc-800">
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">{listing.descricao}</p>
            </div>
          )}

          {/* Actions — apenas para não-dono e anúncios ativos */}
          {!listing.isMine && listing.status === "ativo" && (
            <div className="mt-5 space-y-3">
              {buyError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2 text-sm text-red-400">
                  {buyError}
                </div>
              )}

              <button
                onClick={handleBuy}
                disabled={buyLoading}
                className="w-full py-3 rounded-xl gradient-bg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {buyLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                Comprar com Pix
              </button>

              <div className="grid grid-cols-2 gap-3">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/30 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.531 5.858L.044 23.293a.75.75 0 00.916.916l5.435-1.487A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.733 9.733 0 01-4.98-1.37l-.358-.21-3.717 1.015 1.015-3.717-.21-.358A9.733 9.733 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                <button
                  onClick={() => { if (!session) { router.push("/entrar"); return; } setChatOpen(v => !v); }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${chatOpen ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Chat
                </button>
              </div>
            </div>
          )}

          {/* Vendedor vê botão para abrir chat */}
          {listing.isMine && (
            <div className="mt-5">
              <button
                onClick={() => setChatOpen(v => !v)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors ${chatOpen ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Mensagens recebidas
                {convos.some(c => c.unread > 0) && (
                  <span className="bg-purple-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                    {convos.reduce((a, c) => a + c.unread, 0)}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      {chatOpen && status === "authenticated" && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-200 text-sm">
              {isSeller ? "Conversas" : `Chat com ${listing.vendedorNome}`}
            </h3>
            <button onClick={() => setChatOpen(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Se vendedor, mostrar lista de conversas */}
          {isSeller && convos.length > 0 && (
            <div className="px-4 py-2 border-b border-zinc-800 flex gap-2 overflow-x-auto">
              {convos.map(c => (
                <button
                  key={c.userId}
                  onClick={() => setSelBuyer(c.userId)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selBuyer === c.userId ? "bg-purple-500 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
                >
                  {c.userName}
                  {c.unread > 0 && (
                    <span className="ml-1.5 bg-red-500 text-white text-[10px] rounded-full px-1">{c.unread}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Mensagens */}
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">Carregando...</div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                {isSeller && !selBuyer ? "Selecione uma conversa acima" : "Nenhuma mensagem ainda. Diga olá!"}
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.fromUser.id === session?.user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${isMe ? "bg-purple-600 text-white rounded-br-sm" : "bg-zinc-800 text-zinc-200 rounded-bl-sm"}`}>
                      {!isMe && (
                        <p className="text-[11px] font-semibold mb-0.5 text-zinc-400">{msg.fromUser.name}</p>
                      )}
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-0.5 ${isMe ? "text-purple-200" : "text-zinc-500"}`}>
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="px-4 py-3 border-t border-zinc-800 flex gap-2">
            <input
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              placeholder="Mensagem..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!msgInput.trim() || sendingMsg}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {sendingMsg ? "..." : "Enviar"}
            </button>
          </form>
        </div>
      )}

      {pixData && (
        <PixModal
          pixCode={pixData.pixCode}
          pixQrCode={pixData.pixQrCode}
          valor={pixData.valor}
          onClose={() => setPixData(null)}
        />
      )}
    </div>
  );
}
