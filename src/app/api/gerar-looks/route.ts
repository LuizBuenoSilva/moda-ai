import { NextRequest, NextResponse } from "next/server";
import { gerarLooks } from "@/lib/fashion-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { estilo, ocasiao, orcamento, genero, preferencias } = body;

    if (!estilo || !ocasiao || !orcamento) {
      return NextResponse.json(
        { error: "Campos obrigatórios: estilo, ocasiao, orcamento" },
        { status: 400 }
      );
    }

    const looks = await gerarLooks({
      estilo,
      ocasiao,
      orcamento: Number(orcamento),
      genero,
      preferencias,
    });

    return NextResponse.json({ looks });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Erro ao gerar looks:", msg, error);
    return NextResponse.json(
      { error: `Erro ao gerar looks: ${msg}` },
      { status: 500 }
    );
  }
}
