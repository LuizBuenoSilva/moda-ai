import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;

    // Verify ownership
    const pasta = await prisma.pasta.findFirst({ where: { id, userId }, select: { id: true } });
    if (!pasta) return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });

    const fotos = await prisma.fotoPasta.findMany({
      where: { pastaId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, imageUrl: true, nome: true, createdAt: true },
    });

    return NextResponse.json({ fotos });
  } catch (error) {
    console.error("Erro ao buscar fotos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;

    // Verify ownership
    const pasta = await prisma.pasta.findFirst({ where: { id, userId }, select: { id: true } });
    if (!pasta) return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });

    const { imageUrl, nome } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl obrigatório" }, { status: 400 });
    }

    const foto = await prisma.fotoPasta.create({
      data: { pastaId: id, imageUrl, nome: nome ?? null },
      select: { id: true, imageUrl: true, nome: true, createdAt: true },
    });

    return NextResponse.json({ foto });
  } catch (error) {
    console.error("Erro ao salvar foto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
