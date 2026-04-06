"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cb = params.get("callbackUrl");
    if (cb) setCallbackUrl(cb);
  }, []);

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
          className="w-full py-2.5 rounded-xl bg-white text-zinc-900 font-medium hover:bg-zinc-200 transition-colors"
        >
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
