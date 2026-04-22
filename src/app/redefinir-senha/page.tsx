"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function RedefinirSenhaPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email    = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm  = String(form.get("confirm") ?? "");

    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao redefinir senha");
      setDone(true);
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
          Informe seu email e escolha uma nova senha.
        </p>

        {done ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">✅</div>
            <p className="text-zinc-200 font-medium">Senha atualizada!</p>
            <Link
              href="/entrar"
              className="inline-block mt-2 py-2.5 px-6 rounded-xl gradient-bg text-white font-medium text-sm"
            >
              Fazer login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              name="email"
              placeholder="Seu email"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Nova senha"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500"
            />
            <input
              type="password"
              name="confirm"
              placeholder="Confirmar nova senha"
              required
              minLength={6}
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
              {loading ? "Salvando..." : "Salvar nova senha"}
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
