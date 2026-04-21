import { prisma } from "@/lib/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
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
      // Only store the user id. Strip everything else — especially
      // "picture" which can be a 400 KB base64 data URL and causes
      // 494 REQUEST_HEADER_TOO_LARGE on Vercel.
      if (user) token.sub = user.id;
      token.name    = undefined;
      token.email   = undefined;
      token.picture = undefined;
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        // Fetch only the fields we need — never the image (can be 400 KB)
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, name: true, email: true },
        });
        if (dbUser) {
          session.user = {
            id:    dbUser.id,
            name:  dbUser.name  ?? session.user?.name  ?? null,
            email: dbUser.email ?? session.user?.email ?? null,
            image: null, // never embed image in session — fetch separately when needed
          } as typeof session.user;
        }
      }
      return session;
    },
  },
};
