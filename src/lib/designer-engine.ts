import Anthropic from "@anthropic-ai/sdk";
import { PecaDesignInput, PecaDesignGerada } from "@/types/designer";

const TECIDOS: Record<string, string> = {
  camiseta: "Algodão orgânico 180g/m²",
  camisa: "Linho premium com toque macio",
  jaqueta: "Nylon impermeável com forro de mesh",
  moletom: "Moletom flanelado 100% algodão",
  blazer: "Lã fria mista com elastano",
  vestido: "Crepe georgette fluido",
  calca: "Sarja de algodão com elastano",
  shorts: "Sarja leve de algodão",
  saia: "Crepe acetinado",
  tenis: "Couro sintético premium com mesh",
  bota: "Couro bovino natural",
  bolsa: "Couro ecológico texturizado",
  acessorio: "Aço inoxidável com banho de ouro",
};

const CORTES: Record<string, string> = {
  streetwear: "oversized",
  minimalista: "reto",
  cyberpunk: "slim futurista",
  vintage: "regular retrô",
  "high-fashion": "desconstruído",
  esportivo: "ergonômico",
  boho: "fluido solto",
  grunge: "oversized desestruturado",
  futurista: "slim angular",
  classico: "regular estruturado",
};

function gerarPecaOffline(input: PecaDesignInput): PecaDesignGerada {
  const tecido = TECIDOS[input.tipo] || "Algodão premium";
  const corte = CORTES[input.estilo] || "regular";
  const nomesCores: Record<string, string> = {
    preto: "#000000", branco: "#ffffff", vermelho: "#e53935", azul: "#1565c0",
    verde: "#2e7d32", amarelo: "#fdd835", rosa: "#f06292", roxo: "#7b1fa2",
    laranja: "#ef6c00", marrom: "#6d4c41", cinza: "#78909c", bege: "#d7ccc8",
    neon: "#76ff03", dourado: "#ffc107", prata: "#b0bec5", vinho: "#880e4f",
    "azul marinho": "#1a237e", "azul claro": "#4fc3f7", terracota: "#bf360c",
    coral: "#ff7043", nude: "#d4a574", lilás: "#ce93d8", turquesa: "#00bcd4",
    creme: "#fff8e1", mostarda: "#f9a825", oliva: "#827717", bordô: "#880e4f",
    navy: "#0d47a1", lavanda: "#b39ddb", salmão: "#ff8a65", pistache: "#aed581",
    caramelo: "#8d6e63", grafite: "#455a64", off: "#fafafa", "off-white": "#fafafa",
  };

  // Split by comma, "e", "com", or detect color names directly
  const coresRaw = input.cores
    ? input.cores.split(/[,]|\s+e\s+|\s+com\s+/i).map((c) => c.trim()).filter(Boolean)
    : [];

  const coresHex = coresRaw.length > 0
    ? coresRaw.map((c) => {
        if (c.startsWith("#")) return c;
        const lower = c.toLowerCase().trim();
        // Try exact match first
        if (nomesCores[lower]) return nomesCores[lower];
        // Try partial match (e.g. "azul claro" in "azul claro")
        for (const [nome, hex] of Object.entries(nomesCores)) {
          if (lower.includes(nome) || nome.includes(lower)) return hex;
        }
        return "#888888";
      })
    : ["#1a1a2e", "#ffffff"];

  const nome = `${input.tipo.charAt(0).toUpperCase() + input.tipo.slice(1)} ${input.estilo} "${input.inspiracao || "Conceito Original"}"`;

  const texturas: Record<string, string> = {
    streetwear: "Textura lisa com toque emborrachado nos detalhes gráficos",
    minimalista: "Superfície uniforme e acetinada com toque suave",
    cyberpunk: "Textura técnica com acabamento reflexivo em certas áreas",
    vintage: "Textura levemente desgastada com toque artesanal",
    "high-fashion": "Textura complexa combinando liso e texturizado em camadas",
    esportivo: "Textura dry-fit com perfurações micro para ventilação",
    boho: "Textura artesanal com fibras naturais aparentes",
    grunge: "Textura irregular com aspecto lavado e vivido",
    futurista: "Textura high-tech com brilho sutil e toque liso",
    classico: "Textura refinada e uniforme com caimento impecável",
  };

  const elementos: Record<string, string> = {
    streetwear: "Estampa gráfica frontal bold, etiqueta woven na barra, costuras aparentes contrastantes",
    minimalista: "Sem estampas, detalhes de costura tom sobre tom, etiqueta interna discreta",
    cyberpunk: "Faixas reflexivas neon, zíperes assimétricos funcionais, patches tecnológicos",
    vintage: "Estampa delavê com logo retrô, botões de metal envelhecido, barra desfiada",
    "high-fashion": "Corte assimétrico com drapeado, detalhes de aviamento premium, acabamento artesanal",
    esportivo: "Painéis de ventilação, faixas laterais contrastantes, logo emborrachado",
    boho: "Bordados florais artesanais, franjas nas extremidades, botões de madeira",
    grunge: "Rasgos intencionais, patches costurados à mão, lavagem ácida",
    futurista: "Recortes geométricos com LED, zíper magnético, costuras seladas",
    classico: "Botões de madrepérola, forro acetinado, bolso lenço com monograma",
  };

  return {
    nome,
    tipo: input.tipo,
    estilo: input.estilo,
    descricao: `${input.tipo.charAt(0).toUpperCase() + input.tipo.slice(1)} com design ${input.estilo}, confeccionada em ${tecido.toLowerCase()} com corte ${corte}. ${input.inspiracao ? `Inspiração em ${input.inspiracao}` : "Design conceitual original"}. Peça com acabamento premium e detalhes cuidadosamente pensados para expressar personalidade e estilo.${input.detalhes ? ` ${input.detalhes}.` : ""}`,
    tecido,
    corte,
    textura: texturas[input.estilo] || "Textura suave e uniforme com toque premium",
    elementosVisuais: elementos[input.estilo] || "Detalhes de costura refinados com acabamento premium",
    promptImagem: `A ${corte} ${input.estilo} ${input.tipo}, ${input.cores || "dark tones"}, ${input.inspiracao ? `inspired by ${input.inspiracao},` : ""} ${input.detalhes || "clean design"}, high detail, fashion design flat lay, clean white background, studio lighting, professional fashion photography, 4k, photorealistic`,
    sugestaoUso: `Ideal para ocasiões que pedem estilo ${input.estilo}. Combina bem com peças de cores neutras para equilibrar, ou com peças complementares do mesmo estilo para um look mais marcante. Perfeita para quem busca expressar personalidade com autenticidade.`,
    cores: coresHex.length > 0 ? coresHex : ["#1a1a2e", "#ffffff"],
    inspiracao: input.inspiracao,
  };
}

export async function gerarPecaDesign(input: PecaDesignInput): Promise<PecaDesignGerada> {
  try {
    const anthropic = new Anthropic();

    const prompt = `Você é um designer de moda profissional. Crie um conceito visual para: Tipo: ${input.tipo}, Estilo: ${input.estilo}, Inspiração: ${input.inspiracao}, Cores: ${input.cores}, Detalhes: ${input.detalhes}.

Responda APENAS JSON válido (sem markdown):
{"nome":"...","tipo":"${input.tipo}","estilo":"${input.estilo}","descricao":"...","tecido":"...","corte":"...","textura":"...","elementosVisuais":"...","promptImagem":"A detailed English prompt for DALL-E/Stable Diffusion...","sugestaoUso":"...","cores":["#hex1","#hex2"],"inspiracao":"${input.inspiracao}"}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Resposta inesperada");
    return JSON.parse(content.text);
  } catch {
    console.log("API indisponível, usando engine offline para designer");
    return gerarPecaOffline(input);
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CORES_MAP: Record<string, string> = {
  preto: "#000000", branco: "#ffffff", vermelho: "#e53935", azul: "#1565c0",
  verde: "#2e7d32", amarelo: "#fdd835", rosa: "#f06292", roxo: "#7b1fa2",
  laranja: "#ef6c00", marrom: "#6d4c41", cinza: "#78909c", bege: "#d7ccc8",
  neon: "#76ff03", dourado: "#ffc107", prata: "#b0bec5", vinho: "#880e4f",
  "azul marinho": "#1a237e", "azul claro": "#4fc3f7", terracota: "#bf360c",
  coral: "#ff7043", nude: "#d4a574", lilás: "#ce93d8", turquesa: "#00bcd4",
  creme: "#fff8e1", mostarda: "#f9a825", oliva: "#827717", bordô: "#880e4f",
  navy: "#0d47a1", lavanda: "#b39ddb", salmão: "#ff8a65", pistache: "#aed581",
  caramelo: "#8d6e63", grafite: "#455a64", "off-white": "#fafafa",
};

const TECIDOS_MAP: Record<string, string> = {
  seda: "Seda natural com brilho acetinado", linho: "Linho premium respirável",
  "algodão": "Algodão orgânico 180g/m²", couro: "Couro ecológico texturizado",
  jeans: "Jeans premium com elastano", "dry-fit": "Tecido dry-fit de alta performance",
  veludo: "Veludo macio com toque aveludado", moletom: "Moletom flanelado 100% algodão",
  nylon: "Nylon impermeável com forro de mesh", malha: "Malha canelada com elastano",
  tricot: "Tricot artesanal em lã mista", chiffon: "Chiffon translúcido de poliéster",
  cetim: "Cetim duchesse com brilho luxuoso", lã: "Lã virgem italiana",
  crepe: "Crepe georgette fluido", plush: "Plush ultra macio",
};

const TEXTURAS_MAP: Record<string, string> = {
  streetwear: "Textura lisa com toque emborrachado nos detalhes gráficos",
  minimalista: "Superfície uniforme e acetinada com toque suave",
  cyberpunk: "Textura técnica com acabamento reflexivo em certas áreas",
  vintage: "Textura levemente desgastada com toque artesanal",
  "high-fashion": "Textura complexa combinando liso e texturizado em camadas",
  esportivo: "Textura dry-fit com perfurações micro para ventilação",
  boho: "Textura artesanal com fibras naturais aparentes",
  grunge: "Textura irregular com aspecto lavado e vivido",
  futurista: "Textura high-tech com brilho sutil e toque liso",
  classico: "Textura refinada e uniforme com caimento impecável",
};

const ELEMENTOS_MAP: Record<string, string> = {
  streetwear: "Estampa gráfica frontal bold, etiqueta woven na barra, costuras aparentes contrastantes",
  minimalista: "Sem estampas, detalhes de costura tom sobre tom, etiqueta interna discreta",
  cyberpunk: "Faixas reflexivas neon, zíperes assimétricos funcionais, patches tecnológicos",
  vintage: "Estampa delavê com logo retrô, botões de metal envelhecido, barra desfiada",
  "high-fashion": "Corte assimétrico com drapeado, detalhes de aviamento premium, acabamento artesanal",
  esportivo: "Painéis de ventilação, faixas laterais contrastantes, logo emborrachado",
  boho: "Bordados florais artesanais, franjas nas extremidades, botões de madeira",
  grunge: "Rasgos intencionais, patches costurados à mão, lavagem ácida",
  futurista: "Recortes geométricos com LED, zíper magnético, costuras seladas",
  classico: "Botões de madrepérola, forro acetinado, bolso lenço com monograma",
};

const TIPOS_VALIDOS = ["camiseta", "camisa", "jaqueta", "moletom", "blazer", "vestido", "calca", "shorts", "saia", "tenis", "bota", "bolsa", "acessorio", "regata"];

function refinarPecaOffline(
  pecaAtual: PecaDesignGerada,
  instrucao: string
): { peca: PecaDesignGerada; resposta: string } {
  const lower = instrucao.toLowerCase();
  const peca: PecaDesignGerada = JSON.parse(JSON.stringify(pecaAtual));
  const mudancas: string[] = [];

  // --- Type change ---
  for (const t of TIPOS_VALIDOS) {
    if (lower.includes(t) && t !== peca.tipo.toLowerCase()) {
      peca.tipo = t.charAt(0).toUpperCase() + t.slice(1);
      peca.tecido = TECIDOS[t] || peca.tecido;
      mudancas.push(`Tipo alterado para ${peca.tipo}`);
      break;
    }
  }

  // --- Style change ---
  const estilos = Object.keys(CORTES);
  for (const est of estilos) {
    if (lower.includes(est) && est !== peca.estilo.toLowerCase()) {
      peca.estilo = est;
      peca.corte = CORTES[est] || peca.corte;
      peca.textura = TEXTURAS_MAP[est] || peca.textura;
      peca.elementosVisuais = ELEMENTOS_MAP[est] || peca.elementosVisuais;
      mudancas.push(`Estilo alterado para ${est}`);
      break;
    }
  }

  // --- Color detection ---
  const coresEncontradas: string[] = [];
  const sortedKeys = Object.keys(CORES_MAP).sort((a, b) => b.length - a.length);
  for (const nome of sortedKeys) {
    if (lower.includes(nome)) coresEncontradas.push(CORES_MAP[nome]);
  }
  const hexMatches = instrucao.match(/#[0-9a-fA-F]{6}/g);
  if (hexMatches) coresEncontradas.push(...hexMatches);
  if (coresEncontradas.length > 0) {
    peca.cores = [...new Set(coresEncontradas)].slice(0, 5);
    mudancas.push(`Cores: ${peca.cores.join(", ")}`);
  }

  // --- Fabric change ---
  const sortedFabrics = Object.keys(TECIDOS_MAP).sort((a, b) => b.length - a.length);
  for (const nome of sortedFabrics) {
    if (lower.includes(nome)) {
      peca.tecido = TECIDOS_MAP[nome];
      mudancas.push(`Tecido: ${peca.tecido}`);
      break;
    }
  }

  // --- Cut change ---
  const corteKeywords: Record<string, string> = {
    oversized: "oversized", solto: "oversized solto", largo: "oversized largo",
    slim: "slim", "slim fit": "slim fit", justo: "slim justo",
    reto: "reto clássico", regular: "regular", "skinny": "skinny",
    "relaxed": "relaxed fit", fluido: "fluido", amplo: "amplo",
    estruturado: "estruturado", desconstruído: "desconstruído",
    cropped: "cropped", longline: "longline",
  };
  for (const [kw, corte] of Object.entries(corteKeywords)) {
    if (lower.includes(kw)) {
      peca.corte = corte;
      mudancas.push(`Corte: ${corte}`);
      break;
    }
  }

  // --- Visual elements / details ---
  const detalhes: Record<string, string> = {
    bolso: "bolsos funcionais com zíper", "bolsos cargo": "bolsos cargo laterais amplos",
    estampa: "estampa gráfica personalizada", "estampa floral": "estampa floral all-over",
    "estampa geométrica": "padrão geométrico em contraste", xadrez: "padronagem xadrez clássica",
    "tie-dye": "tingimento tie-dye artesanal", listras: "listras horizontais contrastantes",
    "zíper": "zíper decorativo aparente metálico", zipper: "zíper metálico funcional",
    bordado: "bordado artesanal detalhado", bordados: "bordados decorativos finos",
    "patch": "patches aplicados costurados", patches: "patches temáticos variados",
    capuz: "capuz ajustável com cordão", gola: "gola alta estruturada",
    "gola v": "decote em V profundo", manga: "mangas diferenciadas",
    franjas: "franjas decorativas nas extremidades", tachas: "tachas metálicas decorativas",
    corrente: "detalhe de corrente metálica", fita: "fitas decorativas aplicadas",
    recorte: "recortes geométricos vazados", transparência: "painéis semi-transparentes",
    tigre: "estampa de tigre central", leão: "estampa de leão dourado",
    dragão: "estampa de dragão oriental", águia: "estampa de águia majestosa",
    caveira: "estampa de caveira estilizada", logo: "logo centralizado em destaque",
    animal: "estampa animal print", "animal print": "padronagem animal print",
    flor: "aplicação floral em relevo", flores: "flores bordadas",
    estrela: "estrelas em aplique", raio: "raio gráfico em contraste",
  };
  const detalhesAdded: string[] = [];
  const sortedDetails = Object.keys(detalhes).sort((a, b) => b.length - a.length);
  for (const kw of sortedDetails) {
    if (lower.includes(kw)) {
      detalhesAdded.push(detalhes[kw]);
    }
  }
  if (detalhesAdded.length > 0) {
    peca.elementosVisuais = detalhesAdded.join(", ");
    mudancas.push(`Elementos: ${peca.elementosVisuais}`);
  }

  // --- Mood-based changes ---
  if (lower.includes("ousado") || lower.includes("bold") || lower.includes("chamativo")) {
    peca.elementosVisuais = (peca.elementosVisuais || "") + ", contrastes ousados, detalhes bold e chamativos";
    peca.textura = "Textura marcante com acabamentos contrastantes e brilho";
    mudancas.push("Design mais ousado e chamativo");
  }
  if (lower.includes("discreto") || lower.includes("simples") || lower.includes("clean") || lower.includes("limpo")) {
    peca.elementosVisuais = "Linhas limpas, sem estampa, acabamento tom sobre tom";
    peca.textura = "Superfície uniforme, toque suave e discreto";
    mudancas.push("Design simplificado e discreto");
  }
  if (lower.includes("elegante") || lower.includes("luxo") || lower.includes("sofisticado")) {
    peca.elementosVisuais = "Acabamento premium, detalhes de aviamento fino, costuras invisíveis";
    peca.textura = "Textura refinada com caimento impecável e toque luxuoso";
    peca.tecido = peca.tecido.includes("premium") ? peca.tecido : peca.tecido + " com acabamento premium";
    mudancas.push("Design mais elegante e sofisticado");
  }

  // --- Inspiration ---
  const inspMatch = lower.match(/inspira[çc][aã]o\s+(?:em|de|no|na)\s+(.+?)(?:\.|,|$)/);
  if (inspMatch) {
    peca.inspiracao = inspMatch[1].trim();
    mudancas.push(`Inspiração: ${peca.inspiracao}`);
  }
  const temaKeywords: Record<string, string> = {
    japonês: "cultura japonesa", japão: "cultura japonesa", "anos 90": "moda dos anos 90",
    "anos 80": "moda dos anos 80", "anos 70": "estilo dos anos 70",
    militar: "estética militar", urbano: "cultura urbana", praia: "lifestyle praia",
    noite: "moda noturna", festa: "festa e celebração", punk: "movimento punk",
    gótico: "estética gótica", tropical: "visual tropical", oriental: "estética oriental",
    africano: "padrões africanos", nórdico: "design nórdico minimalista",
    chinês: "cultura chinesa", coreano: "moda coreana", europeu: "elegância europeia",
  };
  for (const [kw, insp] of Object.entries(temaKeywords)) {
    if (lower.includes(kw) && !peca.inspiracao?.includes(insp)) {
      peca.inspiracao = insp;
      mudancas.push(`Inspiração: ${insp}`);
      break;
    }
  }

  // If nothing was detected, apply a generic creative update
  if (mudancas.length === 0) {
    const creativity = [
      { ev: "Costuras contrastantes e detalhes de acabamento diferenciado", tex: "Textura mista com elementos táteis" },
      { ev: "Apliques artesanais com materiais reciclados", tex: "Textura orgânica com fibras naturais" },
      { ev: "Recortes modernos com sobreposição de camadas", tex: "Textura multi-camada com profundidade" },
      { ev: "Detalhes metálicos minimalistas e costuras seladas", tex: "Textura técnica com acabamento futurista" },
    ];
    const pick = creativity[Math.floor(Math.random() * creativity.length)];
    peca.elementosVisuais = pick.ev;
    peca.textura = pick.tex;
    mudancas.push("Apliquei ajustes criativos ao design conforme solicitado");
  }

  // Always update derived fields
  peca.nome = `${peca.tipo.charAt(0).toUpperCase() + peca.tipo.slice(1)} ${peca.estilo} "${peca.inspiracao || "Conceito Original"}"`;
  peca.descricao = `${peca.tipo.charAt(0).toUpperCase() + peca.tipo.slice(1)} com design ${peca.estilo}, confeccionada em ${peca.tecido.toLowerCase()} com corte ${peca.corte}. ${peca.inspiracao ? `Inspiração em ${peca.inspiracao}.` : "Design conceitual original."} ${peca.elementosVisuais}.`;
  peca.promptImagem = `A ${peca.corte} ${peca.estilo} ${peca.tipo}, colors ${peca.cores.join(" and ")}, ${peca.inspiracao ? `inspired by ${peca.inspiracao},` : ""} ${peca.elementosVisuais}, high detail, fashion design flat lay, clean white background, studio lighting, professional fashion photography, 4k, photorealistic`;
  peca.sugestaoUso = `Ideal para ocasiões que pedem estilo ${peca.estilo}. Combina com peças neutras para equilibrar ou peças do mesmo estilo para um look marcante.`;

  return { peca, resposta: mudancas.join(". ") + "." };
}

export async function refinarPecaDesign(
  pecaAtual: PecaDesignGerada,
  instrucao: string,
  historico: ChatMessage[] = []
): Promise<{ peca: PecaDesignGerada; resposta: string }> {
  try {
    const anthropic = new Anthropic();

    const systemPrompt = `Você é um designer de moda profissional ajudando a refinar um design de roupa.
O design atual é:
${JSON.stringify(pecaAtual, null, 2)}

O usuário vai pedir modificações. Aplique as mudanças solicitadas ao design.

IMPORTANTE: Sua resposta deve ser APENAS um JSON válido (sem markdown, sem backticks) com esta estrutura exata:
{
  "resposta": "Breve resumo em português das mudanças feitas (1-2 frases)",
  "peca": { ...o JSON completo da peça atualizada com TODOS os campos... }
}

Campos obrigatórios em "peca": nome, tipo, estilo, descricao, tecido, corte, textura, elementosVisuais, promptImagem, sugestaoUso, cores (array de hex), inspiracao.
Mantenha os campos que não foram alterados. As cores devem ser hex (#xxxxxx).`;

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...historico,
      { role: "user", content: instrucao },
    ];

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Resposta inesperada");
    const parsed = JSON.parse(content.text);
    return { peca: parsed.peca, resposta: parsed.resposta };
  } catch {
    console.log("API indisponível, usando engine offline para refinar design");
    return refinarPecaOffline(pecaAtual, instrucao);
  }
}
