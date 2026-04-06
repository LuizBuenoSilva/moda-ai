import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const { userId, unauthorized } = await getRequiredUser();
    if (!userId) return unauthorized!;

    const body = await req.json();

    const design = await prisma.pecaDesign.create({
      data: {
        nome: body.nome,
        tipo: body.tipo,
        estilo: body.estilo,
        descricao: body.descricao,
        tecido: body.tecido,
        corte: body.corte,
        textura: body.textura,
        elementosVisuais: body.elementosVisuais,
        promptImagem: body.promptImagem,
        sugestaoUso: body.sugestaoUso,
        cores: JSON.stringify(body.cores),
        inspiracao: body.inspiracao || null,
        svgSketch: body.svgSketch || null,
        userId,
      },
    });

    return NextResponse.json({ id: design.id, design });
  } catch (error) {
    console.error("Erro ao salvar design:", error);
    return NextResponse.json(
      { error: "Erro ao salvar design da peça" },
      { status: 500 }
    );
  }
}
