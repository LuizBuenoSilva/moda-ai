import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getRequiredUser } from "@/lib/auth-helpers";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const { userId, unauthorized } = await getRequiredUser();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const looks: Array<{
    nome: string;
    estilo: string;
    ocasiao: string;
    precoEstimado: number;
    cores: string;
    pecas: Array<{ categoria: string; nome: string; cor: string; tecido?: string | null; corte?: string | null }>;
  }> = body.looks ?? [];

  if (!looks.length) {
    return NextResponse.json({ error: "Nenhum look enviado" }, { status: 400 });
  }

  // Summarize existing looks for the prompt
  const looksResumo = looks
    .slice(0, 6) // cap to avoid token overflow
    .map((l, i) => {
      const pecasStr = l.pecas
        .map(p => `${p.categoria}: ${p.nome}${p.tecido ? ` (${p.tecido})` : ""}`)
        .join(", ");
      return `${i + 1}. "${l.nome}" — estilo ${l.estilo}, ocasião ${l.ocasiao}, R$${l.precoEstimado} | Peças: ${pecasStr}`;
    })
    .join("\n");

  // Infer common style and budget from existing looks
  const estilos = looks.map(l => l.estilo);
  const estiloFreq: Record<string, number> = {};
  estilos.forEach(e => { estiloFreq[e] = (estiloFreq[e] || 0) + 1; });
  const estiloFavorito = Object.entries(estiloFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "casual";
  const orcamentoMedio = Math.round(looks.reduce((s, l) => s + l.precoEstimado, 0) / looks.length);

  const prompt = `Você é um stylist pessoal. O usuário tem estes looks salvos no guarda-roupa:

${looksResumo}

Com base no estilo predominante (${estiloFavorito}) e orçamento médio (R$${orcamentoMedio}), crie UM look NOVO e DIFERENTE que:
- Complete lacunas do guarda-roupa (explore ocasiões ou estilos ainda não cobertos)
- Misture e combine bem com peças que o usuário já tem
- Traga pelo menos uma peça ou combinação de cor que ainda não aparece nos looks acima
- Tenha preço total próximo a R$${orcamentoMedio}

TABELA DE PREÇOS BR 2024:
- Camiseta/regata: Renner R$39-89 | Zara R$99-199
- Calça jeans: Renner R$89-169 | Levi's R$199-399
- Tênis: Renner R$99-179 | Nike/Adidas R$299-599
- Acessório: Renner R$19-69 | premium R$89-299

Responda APENAS JSON válido (sem markdown, sem texto extra) no formato:
{"nome":"...","descricao":"...","estilo":"...","ocasiao":"...","genero":null,"precoEstimado":0,"orcamento":${orcamentoMedio},"explicacao":"...","cores":["#hex","#hex","#hex"],"pecas":[{"categoria":"top|bottom|shoes|accessory","nome":"...","descricao":"...","cor":"#hex","preco":0,"tecido":"...","corte":"slim|regular|oversized|wide","detalhes":"...","lojas":["Loja1","Loja2"],"imagemQuery":"..."}],"outfitJson":{"top":{"type":"tshirt|camisa|jaqueta|moletom|regata|blazer|cropped|sueter","color":"#hex","material":"algodao|seda|couro|jeans|linho|sintetico|la","fit":"slim|regular|oversized"},"bottom":{"type":"calca|shorts|saia|saia_longa|jogger|legging","color":"#hex","material":"jeans|algodao|couro|seda|sintetico","fit":"slim|regular|wide"},"shoes":{"type":"tenis|bota|sapato_social|sandalia|salto|mocassim|sapatilha","color":"#hex","material":"couro|camurca|sintetico|tecido"},"accessories":[{"type":"chapeu|bone|colar|pulseira|relogio|bolsa|oculos|brinco|cinto|anel|lenco|mochila","color":"#hex"}]}}`;

  try {
    const anthropic = new Anthropic();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Resposta inesperada");

    const cleaned = content.text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const look = JSON.parse(cleaned);

    return NextResponse.json({ look });
  } catch (err) {
    console.error("sugerir-look error:", err);
    return NextResponse.json({ error: "Não foi possível gerar sugestão" }, { status: 500 });
  }

  void userId; // used via getRequiredUser for auth check
}
