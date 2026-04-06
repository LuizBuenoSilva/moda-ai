import { NextRequest, NextResponse } from "next/server";
import { gerarPecaDesign } from "@/lib/designer-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, estilo, inspiracao, cores, detalhes } = body;

    if (!tipo || !estilo) {
      return NextResponse.json(
        { error: "Campos obrigatórios: tipo, estilo" },
        { status: 400 }
      );
    }

    const peca = await gerarPecaDesign({
      tipo,
      estilo,
      inspiracao: inspiracao || "",
      cores: cores || "",
      detalhes: detalhes || "",
    });

    return NextResponse.json({ peca });
  } catch (error) {
    console.error("Erro ao gerar peça:", error);
    return NextResponse.json(
      { error: "Erro ao gerar conceito da peça. Tente novamente." },
      { status: 500 }
    );
  }
}
