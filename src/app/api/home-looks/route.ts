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
