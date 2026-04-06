import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const designs = await prisma.pecaDesign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ designs });
  } catch (error) {
    console.error("Erro ao buscar designs:", error);
    return NextResponse.json(
      { error: "Erro ao buscar designs" },
      { status: 500 }
    );
  }
}
