import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const designs = await prisma.pecaDesign.findMany({
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
