import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id, fotoId } = await params;

    // Verify pasta ownership then delete
    const pasta = await prisma.pasta.findFirst({ where: { id, userId }, select: { id: true } });
    if (!pasta) return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });

    await prisma.fotoPasta.deleteMany({ where: { id: fotoId, pastaId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar foto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
