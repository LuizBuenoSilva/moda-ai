import { prisma } from "@/lib/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const isProduction = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  // Shorten cookie names so request headers stay under the 8 KB Vercel limit
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-na.st" : "na.st",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isProduction },
    },
    callbackUrl: {
      name: isProduction ? "__Secure-na.cb" : "na.cb",
      options: { sameSite: "lax", path: "/", secure: isProduction },
    },
    csrfToken: {
      name: isProduction ? "__Host-na.csrf" : "na.csrf",
      options: { httpOnly: true, sameSite: "lax", path: "/" },
    },
    pkceCodeVerifier: {
      name: isProduction ? "__Secure-na.pkce" : "na.pkce",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isProduction, maxAge: 900 },
    },
    state: {
      name: isProduction ? "__Secure-na.state" : "na.state",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isProduction, maxAge: 900 },
    },
    nonce: {
      name: isProduction ? "__Secure-na.nonce" : "na.nonce",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isProduction },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  pages: {
    signIn: "/entrar",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};
