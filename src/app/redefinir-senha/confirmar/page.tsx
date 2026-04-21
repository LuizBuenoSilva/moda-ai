"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ConfirmarForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setError("Link inválido. Solicite um novo link de redefinição.");
    }
  }, [token, email]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
        body: JSON.stringify({ token, email, password }),
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

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✅</div>
        <p className="text-zinc-200 font-medium">Senha redefinida!</p>
        <p className="text-zinc-400 text-sm">Sua nova senha foi salva com sucesso.</p>
        <Link
          href="/entrar"
          className="inline-block mt-2 py-2.5 px-6 rounded-xl gradient-bg text-white font-medium text-sm"
        >
          Fazer login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-zinc-400 text-sm mb-2">
        Criando nova senha para <span className="text-zinc-200">{email}</span>
      </p>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nova senha"
        required
        minLength={6}
        className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
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
        disabled={loading || !token || !email}
        className="w-full py-2.5 rounded-xl gradient-bg text-white font-medium disabled:opacity-60"
      >
        {loading ? "Salvando..." : "Salvar nova senha"}
      </button>

      <Link
        href="/redefinir-senha"
        className="block text-center mt-2 text-sm text-zinc-400 hover:text-zinc-200"
      >
        Solicitar novo link
      </Link>
    </form>
  );
}

export default function ConfirmarPage() {
  return (
    <div className="px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-1">Nova senha</h1>
        <p className="text-zinc-400 text-sm mb-6">Escolha uma senha segura para sua conta.</p>
        <Suspense fallback={<p className="text-zinc-400 text-sm">Carregando...</p>}>
          <ConfirmarForm />
        </Suspense>
      </div>
    </div>
  );
}
