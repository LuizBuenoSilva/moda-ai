"use client";

import { FormEvent, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ProfilePhotoUpload from "@/components/auth/ProfilePhotoUpload";

export default function EntrarPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("/estilista");
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cb = params.get("callbackUrl");
    if (cb) {
      try {
        const url = new URL(cb);
        setCallbackUrl(url.pathname + url.search);
      } catch {
        setCallbackUrl(cb);
      }
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl || "/estilista");
    }
  }, [status, callbackUrl, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      if (isRegister) {
        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            image: profilePhoto,
          }),
        });

        if (!registerRes.ok) {
          const data = await registerRes.json();
          throw new Error(data.error || "Não foi possível criar a conta");
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Email ou senha inválidos");
      }

      router.push(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-1">
          {isRegister ? "Criar conta" : "Entrar na Yuzo"}
        </h1>
        <p className="text-zinc-400 text-sm mb-6">
          Acesse sua experiência única com seus looks, designs e avatar.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full py-2.5 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar com Google
        </button>

        <div className="my-4 text-center text-xs text-zinc-500">ou</div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <>
              <input
                name="name"
                placeholder="Nome"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500"
              />
              <ProfilePhotoUpload
                photoDataUrl={profilePhoto}
                onPhotoChange={setProfilePhoto}
                disabled={loading}
              />
            </>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm outline-none focus:border-purple-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Senha"
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
            {loading ? "Aguarde..." : isRegister ? "Criar conta e entrar" : "Entrar"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsRegister((v) => !v);
            setProfilePhoto(null);
            setError(null);
          }}
          className="w-full mt-4 text-sm text-zinc-400 hover:text-zinc-200"
        >
          {isRegister ? "Já tenho conta" : "Ainda não tenho conta"}
        </button>
      </div>
    </div>
  );
}
