import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;
    const deleted = await prisma.pecaDesign.deleteMany({ where: { id, userId } });
    if (!deleted.count) {
      return NextResponse.json({ error: "Design não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar design:", error);
    return NextResponse.json(
      { error: "Erro ao deletar design" },
      { status: 500 }
    );
  }
}
