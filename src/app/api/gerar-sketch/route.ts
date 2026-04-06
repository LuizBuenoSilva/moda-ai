import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { PecaDesignGerada } from "@/types/designer";

export async function POST(request: Request) {
  try {
    const peca: PecaDesignGerada = await request.json();

    if (!peca || !peca.tipo || !peca.estilo) {
      return NextResponse.json({ error: "Dados da peça inválidos" }, { status: 400 });
    }

    const anthropic = new Anthropic();

    const prompt = `Você é um ilustrador de moda profissional. Crie um SVG detalhado de um fashion sketch (ilustração de moda) para a seguinte peça:

PEÇA:
- Tipo: ${peca.tipo}
- Estilo: ${peca.estilo}
- Corte: ${peca.corte}
- Tecido: ${peca.tecido}
- Cores: ${peca.cores.join(", ")}
- Textura: ${peca.textura}
- Elementos Visuais: ${peca.elementosVisuais}
- Descrição: ${peca.descricao}
${peca.inspiracao ? `- Inspiração: ${peca.inspiracao}` : ""}

INSTRUÇÕES PARA O SVG:
1. Crie um SVG com viewBox="0 0 400 550" que seja uma ilustração de moda profissional
2. Desenhe a peça de roupa com DETALHES ÚNICOS e CRIATIVOS - NÃO use formas genéricas
3. Use as cores exatas fornecidas (${peca.cores.join(", ")})
4. Inclua detalhes como: costuras, texturas, padrões, elementos visuais descritos
5. O fundo deve ser transparente ou um gradiente suave
6. Use gradientes, patterns e formas complexas para dar realismo
7. Adicione sombras sutis para profundidade
8. Inclua detalhes do tecido (drapeado, caimento, textura visual)
9. Se tiver estampa ou padrão, desenhe-o de forma visível
10. O sketch deve parecer um desenho técnico de moda com estilo artístico

ESTILO DO DESENHO:
- Traço elegante e fluido como croqui de moda
- Proporções de ilustração de moda (alongadas e estilizadas)
- Detalhamento nos acabamentos, costuras e aviamentos
- Se for roupa de corpo (camiseta, vestido, jaqueta etc), mostre em um corpo/manequim estilizado com linhas finas
- Se for acessório (bolsa, tênis), mostre o objeto em perspectiva 3/4

IMPORTANTE: Responda APENAS com o código SVG puro. Sem markdown, sem backticks, sem explicação. Apenas o SVG começando com <svg e terminando com </svg>.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Resposta inesperada da IA" }, { status: 500 });
    }

    let svg = content.text.trim();

    // Clean up any markdown wrapping if present
    if (svg.startsWith("```")) {
      svg = svg.replace(/^```(?:svg|xml)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    // Validate it's actually SVG
    if (!svg.startsWith("<svg")) {
      // Try to extract SVG from the response
      const svgMatch = svg.match(/<svg[\s\S]*<\/svg>/);
      if (svgMatch) {
        svg = svgMatch[0];
      } else {
        return NextResponse.json({ error: "IA não gerou SVG válido" }, { status: 500 });
      }
    }

    return NextResponse.json({ svg });
  } catch (error) {
    console.error("Erro ao gerar sketch:", error);
    return NextResponse.json(
      { error: "Erro ao gerar sketch com IA" },
      { status: 500 }
    );
  }
}
