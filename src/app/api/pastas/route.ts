import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const pastas = await prisma.pasta.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { looks: true, designs: true } } },
    });
    return NextResponse.json({ pastas });
  } catch (error) {
    console.error("Erro ao buscar pastas:", error);
    return NextResponse.json({ error: "Erro ao buscar pastas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const body = await req.json();
    const pasta = await prisma.pasta.create({
      data: {
        nome: body.nome,
        tipo: body.tipo,
        cor: body.cor || "#a855f7",
        userId,
      },
    });
    return NextResponse.json({ pasta });
  } catch (error) {
    console.error("Erro ao criar pasta:", error);
    return NextResponse.json({ error: "Erro ao criar pasta" }, { status: 500 });
  }
}
