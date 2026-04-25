import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

// DELETE — remove your own look
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id } = await params;
    const deleted = await prisma.feedLook.deleteMany({ where: { id, userId } });
    if (!deleted.count) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("feed DELETE error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
