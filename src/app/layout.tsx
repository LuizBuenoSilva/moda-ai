import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import AuthSessionProvider from "@/components/providers/AuthSessionProvider";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#a855f7",
};

export const metadata: Metadata = {
  title: "Yuzo - Seu Estilista Virtual com IA",
  description:
    "Gere looks personalizados com inteligência artificial, crie conceitos de moda e visualize em avatar 3D.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Yuzo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <AuthSessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <InstallPrompt />
          <ServiceWorkerRegister />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
