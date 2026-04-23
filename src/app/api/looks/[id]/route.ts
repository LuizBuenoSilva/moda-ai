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
    const look = await prisma.look.findFirst({
      where: { id, userId },
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.look.updateMany({
      where: { id, userId },
      data: {
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      },
    });

    if (!updated.count) {
      return NextResponse.json({ error: "Look não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar look:", error);
    return NextResponse.json({ error: "Erro ao atualizar look" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;
    const deleted = await prisma.look.deleteMany({ where: { id, userId } });
    if (!deleted.count) {
      return NextResponse.json({ error: "Look não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar look:", error);
    return NextResponse.json(
      { error: "Erro ao deletar look" },
      { status: 500 }
    );
  }
}
