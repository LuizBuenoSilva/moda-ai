"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "/estilista", label: "Estilista" },
  { href: "/designer", label: "Designer" },
  { href: "/inspiracao", label: "Inspiração" },
  { href: "/colecao", label: "Coleção" },
  { href: "/comunidade", label: "Comunidade" },
  { href: "/avatar", label: "Avatar 3D" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold gradient-text">
          Yuzo
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {status === "authenticated" ? (
            <div className="flex items-center gap-2 ml-3">
              <Link
                href="/conta"
                className="px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800"
              >
                {session.user?.name ?? "Minha Conta"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/entrar"
              className="ml-3 px-4 py-2 rounded-lg text-sm font-medium gradient-bg text-white hover:opacity-90"
            >
              Entrar
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-zinc-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-6 py-3 text-sm font-medium border-b border-zinc-800/50 ${
                pathname === link.href
                  ? "text-purple-300 bg-purple-500/10"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {status === "authenticated" ? (
            <>
              <Link
                href="/conta"
                onClick={() => setOpen(false)}
                className="block px-6 py-3 text-sm font-medium border-b border-zinc-800/50 text-zinc-300 hover:bg-zinc-800/50"
              >
                Minha Conta
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left px-6 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              href="/entrar"
              onClick={() => setOpen(false)}
              className="block px-6 py-3 text-sm font-medium border-b border-zinc-800/50 text-purple-300 hover:bg-zinc-800/50"
            >
              Entrar
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
