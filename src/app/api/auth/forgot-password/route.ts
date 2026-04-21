import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check user exists — always return success to avoid email enumeration
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (user && user.email) {
      // Delete any existing token for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: `reset:${normalizedEmail}` },
      });

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await prisma.verificationToken.create({
        data: {
          identifier: `reset:${normalizedEmail}`,
          token,
          expires,
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const resetLink = `${baseUrl}/redefinir-senha/confirmar?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

      await resend.emails.send({
        from: "Yuzo Style <onboarding@resend.dev>",
        to: user.email,
        subject: "Redefinição de senha — Yuzo Style",
        html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#18181b;font-family:system-ui,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:#27272a;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#a855f7,#ec4899);padding:32px 32px 24px">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">Yuzo Style</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,.8);font-size:14px">Redefinição de senha</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 8px;color:#e4e4e7;font-size:15px">Olá, ${user.name ?? ""}!</p>
      <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.6">
        Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#e4e4e7">1 hora</strong>.
      </p>
      <a href="${resetLink}"
         style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px">
        Redefinir minha senha
      </a>
      <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.6">
        Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanece a mesma.<br><br>
        Ou copie o link: <span style="color:#a1a1aa;word-break:break-all">${resetLink}</span>
      </p>
    </div>
  </div>
</body>
</html>`,
      });
    }

    // Always return 200 to avoid email enumeration
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("forgot-password error:", JSON.stringify(err, null, 2));
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
