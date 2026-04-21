import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const identifier = `reset:${normalizedEmail}`;

    const record = await prisma.verificationToken.findFirst({
      where: { identifier, token },
    });

    if (!record) {
      return NextResponse.json({ error: "Link inválido ou já utilizado" }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      });
      return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    });

    // Invalidate the token after use
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token } },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("reset-password error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
