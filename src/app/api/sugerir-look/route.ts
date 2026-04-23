import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getRequiredUser } from "@/lib/auth-helpers";

export const maxDuration = 45;

interface LookPayload {
  nome: string;
  estilo: string;
  ocasiao: string;
  precoEstimado: number;
  cores: string;
  imageUrl?: string | null;
  pecas: Array<{ categoria: string; nome: string; cor: string; tecido?: string | null; corte?: string | null }>;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/webp"; data: string } };

export async function POST(req: NextRequest) {
  const { userId, unauthorized } = await getRequiredUser();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const looks: LookPayload[] = body.looks ?? [];

  if (!looks.length) {
    return NextResponse.json({ error: "Nenhum look enviado" }, { status: 400 });
  }

  const anthropic = new Anthropic();
  const looksComFoto = looks.filter(l => l.imageUrl);

  try {
    // ── VISION MODE: analyse photos and suggest combinations ──────────────
    if (looksComFoto.length > 0) {
      const looksResumo = looks
        .map((l, i) => {
          const pecasStr = l.pecas.map(p => `${p.categoria}: ${p.nome}`).join(", ");
          return `Look ${i + 1} — "${l.nome}" (${l.estilo}, ${l.ocasiao}): ${pecasStr}`;
        })
        .join("\n");

      const content: ContentBlock[] = [
        {
          type: "text",
          text: `Você é um stylist pessoal. O usuário tem os seguintes looks salvos:\n\n${looksResumo}\n\nAbaixo estão fotos de alguns desses looks. Analise as imagens e sugira a MELHOR combinação de peças que o usuário já possui, explicando detalhadamente como montar o visual.`,
        },
      ];

      looksComFoto.slice(0, 4).forEach((l) => {
        const raw = l.imageUrl!;
        const base64 = raw.includes(",") ? raw.split(",")[1] : raw;
        const mimeMatch = raw.match(/data:(image\/[a-z]+);/);
        const mediaType = (mimeMatch?.[1] ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

        content.push({ type: "text", text: `Foto do look "${l.nome}":` });
        content.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } });
      });

      content.push({
        type: "text",
        text: `Com base nas fotos, responda APENAS JSON válido (sem markdown):
{
  "combinacao": "Descrição detalhada do look combinado — o que usar, como usar, por quê funciona (3-4 frases)",
  "looks_usados": ["nome do look 1", "nome do look 2"],
  "pecas_sugeridas": [
    { "look": "nome do look de onde vem a peça", "peca": "nome da peça", "motivo": "por que esta peça é essencial neste look" }
  ],
  "dica_estilo": "Dica prática de como montar/usar o look completo",
  "ocasiao": "Para qual(is) ocasião(ões) este look funciona melhor"
}`,
      });

      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{ role: "user", content }],
      });

      const textContent = message.content[0];
      if (textContent.type !== "text") throw new Error("Resposta inesperada");

      const cleaned = textContent.text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const resultado = JSON.parse(cleaned);

      return NextResponse.json({ tipo: "combinacao", resultado });
    }

    // ── TEXT MODE: generate a brand new look ──────────────────────────────
    const looksResumo = looks
      .slice(0, 6)
      .map((l, i) => {
        const pecasStr = l.pecas
          .map(p => `${p.categoria}: ${p.nome}${p.tecido ? ` (${p.tecido})` : ""}`)
          .join(", ");
        return `${i + 1}. "${l.nome}" — estilo ${l.estilo}, ocasião ${l.ocasiao}, R$${l.precoEstimado} | Peças: ${pecasStr}`;
      })
      .join("\n");

    const estilos = looks.map(l => l.estilo);
    const estiloFreq: Record<string, number> = {};
    estilos.forEach(e => { estiloFreq[e] = (estiloFreq[e] || 0) + 1; });
    const estiloFavorito = Object.entries(estiloFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "casual";
    const orcamentoMedio = Math.round(looks.reduce((s, l) => s + l.precoEstimado, 0) / looks.length);
    const nomesSalvos = looks.map(l => `"${l.nome}"`).join(", ");

    const MOOD_HINTS = [
      "Inspire-se em tendências recentes — algo diferente do que o usuário já tem.",
      "Aposte em contraste de texturas e cores inesperadas.",
      "Misture o formal com o casual de forma criativa.",
      "Pense em uma ocasião que ainda não está coberta no guarda-roupa.",
      "Priorize peças versáteis que mudam totalmente de acordo com o acessório.",
    ];
    const moodHint = MOOD_HINTS[Math.floor(Math.random() * MOOD_HINTS.length)];

    const prompt = `Você é um stylist pessoal. O usuário tem estes looks salvos no guarda-roupa:

${looksResumo}

Looks já existentes (NÃO repita nomes nem combinações iguais): ${nomesSalvos}

Com base no estilo predominante (${estiloFavorito}) e orçamento médio (R$${orcamentoMedio}), crie UM look COMPLETAMENTE NOVO que:
- Explore uma ocasião ou estilo que ainda NÃO aparece acima
- Use cores e peças diferentes das já listadas
- Diretriz criativa: ${moodHint}
- Tenha preço total próximo a R$${orcamentoMedio}

TABELA DE PREÇOS BR 2024:
- Camiseta/regata: Renner R$39-89 | Zara R$99-199
- Calça jeans: Renner R$89-169 | Levi's R$199-399
- Tênis: Renner R$99-179 | Nike/Adidas R$299-599
- Acessório: Renner R$19-69 | premium R$89-299

Responda APENAS JSON válido (sem markdown):
{"nome":"...","descricao":"...","estilo":"...","ocasiao":"...","genero":null,"precoEstimado":0,"orcamento":${orcamentoMedio},"explicacao":"...","cores":["#hex","#hex","#hex"],"pecas":[{"categoria":"top|bottom|shoes|accessory","nome":"...","descricao":"...","cor":"#hex","preco":0,"tecido":"...","corte":"slim|regular|oversized|wide","detalhes":"...","lojas":["Loja1","Loja2"],"imagemQuery":"..."}],"outfitJson":{"top":{"type":"tshirt|camisa|jaqueta|moletom|regata|blazer|cropped|sueter","color":"#hex","material":"algodao|seda|couro|jeans|linho|sintetico|la","fit":"slim|regular|oversized"},"bottom":{"type":"calca|shorts|saia|saia_longa|jogger|legging","color":"#hex","material":"jeans|algodao|couro|seda|sintetico","fit":"slim|regular|wide"},"shoes":{"type":"tenis|bota|sapato_social|sandalia|salto|mocassim|sapatilha","color":"#hex","material":"couro|camurca|sintetico|tecido"},"accessories":[{"type":"chapeu|bone|colar|pulseira|relogio|bolsa|oculos|brinco|cinto|anel|lenco|mochila","color":"#hex"}]}}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Resposta inesperada");

    const cleaned = content.text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const look = JSON.parse(cleaned);

    return NextResponse.json({ tipo: "novo_look", look });
  } catch (err) {
    console.error("sugerir-look error:", err);
    return NextResponse.json({ error: "Não foi possível gerar sugestão" }, { status: 500 });
  }

  void userId;
}
