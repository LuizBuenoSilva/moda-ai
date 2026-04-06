import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const look = await prisma.look.findUnique({
      where: { id },
      include: { pecas: true },
    });

    if (!look) {
      return NextResponse.json(
        { error: "Look não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ look });
  } catch (error) {
    console.error("Erro ao buscar look:", error);
    return NextResponse.json(
      { error: "Erro ao buscar look" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.look.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar look:", error);
    return NextResponse.json(
      { error: "Erro ao deletar look" },
      { status: 500 }
    );
  }
}
