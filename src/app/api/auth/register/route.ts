import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const image = body.image ? String(body.image) : null;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter ao menos 6 caracteres" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        image,
        passwordHash,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}
