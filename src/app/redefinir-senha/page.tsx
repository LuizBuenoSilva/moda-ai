"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function RedefinirSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao enviar email");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-1">Redefinir senha</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Insira seu email e enviaremos um link para criar uma nova senha.
        </p>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📬</div>
            <p className="text-zinc-200 font-medium">Email enviado!</p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Se existe uma conta com esse email, você receberá um link em breve.
              Verifique também a caixa de spam.
            </p>
            <Link
              href="/entrar"
              className="inline-block mt-2 text-sm text-purple-400 hover:text-purple-300 underline"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500"
            />

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl gradient-bg text-white font-medium disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar link de redefinição"}
            </button>

            <Link
              href="/entrar"
              className="block text-center mt-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
