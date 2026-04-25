import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const { id: feedLookId } = await params;

    const existing = await prisma.feedSave.findUnique({
      where: { feedLookId_userId: { feedLookId, userId } },
    });

    if (existing) {
      await prisma.feedSave.delete({ where: { feedLookId_userId: { feedLookId, userId } } });
      return NextResponse.json({ salvo: false });
    } else {
      await prisma.feedSave.create({ data: { feedLookId, userId } });
      return NextResponse.json({ salvo: true });
    }
  } catch (err) {
    console.error("feed save error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
