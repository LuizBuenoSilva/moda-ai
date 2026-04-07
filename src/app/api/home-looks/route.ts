import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function GET() {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  const looks = await prisma.homeLook.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ looks });
}

export async function POST(req: NextRequest) {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  try {
    const body = await req.json();
    const look = await prisma.homeLook.create({
      data: {
        userId,
        nome: String(body.nome ?? "Look de Casa"),
        descricao: body.descricao ? String(body.descricao) : null,
        imageUrl: body.imageUrl ? String(body.imageUrl) : null,
        tags: Array.isArray(body.tags) ? JSON.stringify(body.tags) : null,
      },
    });
    return NextResponse.json({ look });
  } catch (error) {
    console.error("Erro ao salvar look de casa:", error);
    return NextResponse.json({ error: "Erro ao salvar look" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId, unauthorized } = await getRequiredUser();
  if (!userId) return unauthorized!;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  try {
    const look = await prisma.homeLook.findUnique({ where: { id } });
    if (!look || look.userId !== userId) {
      return NextResponse.json({ error: "Look não encontrado" }, { status: 404 });
    }

    await prisma.homeLook.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir look:", error);
    return NextResponse.json({ error: "Erro ao excluir look" }, { status: 500 });
  }
}
