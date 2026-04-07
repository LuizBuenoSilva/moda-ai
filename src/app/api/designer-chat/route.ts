import { NextRequest, NextResponse } from "next/server";
import { refinarPecaDesign, ChatMessage } from "@/lib/designer-engine";
import { PecaDesignGerada } from "@/types/designer";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pecaAtual,
      instrucao,
      historico,
    }: {
      pecaAtual: PecaDesignGerada;
      instrucao: string;
      historico?: ChatMessage[];
    } = body;

    if (!pecaAtual || !instrucao) {
      return NextResponse.json(
        { error: "pecaAtual e instrucao são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await refinarPecaDesign(
      pecaAtual,
      instrucao,
      historico || []
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Erro no designer-chat:", err);
    return NextResponse.json(
      { error: "Erro ao refinar design" },
      { status: 500 }
    );
  }
}
