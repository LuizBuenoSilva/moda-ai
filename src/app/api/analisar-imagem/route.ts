import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { gerarLooks, normalizeStyle } from "@/lib/fashion-engine";

interface AnaliseResult {
  estilo: string;
  pecas: Array<{
    tipo: string;
    cor: string;
    material: string;
    descricao: string;
  }>;
  ocasiao: string;
  cores: string[];
  descricao: string;
  sugestoes: string;
}

function gerarAnaliseOffline(): AnaliseResult {
  return {
    estilo: "casual",
    pecas: [
      { tipo: "camiseta", cor: "#1a1a2e", material: "algodão", descricao: "Peça superior em tom escuro com caimento confortável" },
      { tipo: "calça", cor: "#2c3e50", material: "jeans", descricao: "Calça em tom escuro com corte moderno" },
      { tipo: "tênis", cor: "#ffffff", material: "couro sintético", descricao: "Calçado branco minimalista" },
    ],
    ocasiao: "dia a dia",
    cores: ["#1a1a2e", "#2c3e50", "#ffffff"],
    descricao: "Look casual e confortável com peças em tons neutros. A combinação de escuros com calçado branco cria contraste elegante.",
    sugestoes: "Para variar, experimente adicionar um acessório colorido como um relógio ou pulseira. Uma jaqueta jeans também complementaria bem este visual.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const orcamento = Number(formData.get("orcamento") || 500);

    type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    let imageData: { type: "base64"; media_type: MediaType; data: string } | null = null;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const validTypes: MediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const mediaType: MediaType = validTypes.includes(file.type as MediaType)
        ? (file.type as MediaType)
        : "image/jpeg";
      imageData = { type: "base64", media_type: mediaType, data: base64 };
    }

    if (!imageData && !imageUrl) {
      return NextResponse.json(
        { error: "Envie uma imagem ou cole um link de imagem" },
        { status: 400 }
      );
    }

    let analise: AnaliseResult;

    try {
      const anthropic = new Anthropic();

      const imageContent = imageData
        ? { type: "image" as const, source: imageData }
        : { type: "image" as const, source: { type: "url" as const, url: imageUrl! } };

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              imageContent,
              {
                type: "text",
                text: `Analise esta imagem de moda/roupa e extraia informações detalhadas. Responda APENAS JSON válido (sem markdown):

{
  "estilo": "nome do estilo (casual, streetwear, elegante, minimalista, etc)",
  "pecas": [
    {"tipo": "tipo da peça", "cor": "#hexcolor", "material": "material estimado", "descricao": "descrição breve"}
  ],
  "ocasiao": "ocasião adequada para este look",
  "cores": ["#hex1", "#hex2", "#hex3"],
  "descricao": "Descrição completa do look em português",
  "sugestoes": "Sugestões de como adaptar/melhorar este look em português"
}`,
              },
            ],
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== "text") throw new Error("Resposta inesperada");
      analise = JSON.parse(content.text);
    } catch {
      console.log("API indisponível, usando análise offline");
      analise = gerarAnaliseOffline();
    }

    // Generate similar looks based on analysis — normalize style so it always maps
    // to a known category (prevents falling back to "casual" on unknown labels)
    const looks = await gerarLooks({
      estilo: normalizeStyle(analise.estilo),
      ocasiao: analise.ocasiao,
      orcamento,
      preferencias: analise.descricao,
    });

    return NextResponse.json({ analise, looks });
  } catch (error) {
    console.error("Erro ao analisar imagem:", error);
    return NextResponse.json(
      { error: "Erro ao analisar imagem. Tente novamente." },
      { status: 500 }
    );
  }
}
