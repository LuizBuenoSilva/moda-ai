import Anthropic from "@anthropic-ai/sdk";
import { LookInput, LookGerado, OutfitJson } from "@/types/look";

// ==================== RULE-BASED FALLBACK ENGINE ====================

interface PecaDB {
  nome: string;
  descricao: string;
  categoria: "top" | "bottom" | "shoes" | "accessory";
  estilos: string[];
  precoMin: number;
  precoMax: number;
  cores: string[];
  tecido: string | null;
  corte: string | null;
  generos: string[];
  outfitType: string;
  outfitMaterial: string;
  outfitFit: string;
  lojas: string[];
}

const PECAS: PecaDB[] = [
  // === TOPS ===
  { nome: "Camiseta oversized de algodão premium", descricao: "Camiseta com caimento amplo e tecido macio", categoria: "top", estilos: ["casual", "streetwear", "urbano"], precoMin: 49, precoMax: 89, cores: ["#1a1a2e", "#2d2d2d", "#f5f5dc", "#c0392b", "#1e3a5f"], tecido: "algodão", corte: "oversized", generos: ["masculino", "feminino", "unissex"], outfitType: "tshirt", outfitMaterial: "algodao", outfitFit: "oversized", lojas: ["Renner", "C&A", "Zara"] },
  { nome: "Camiseta slim fit básica de algodão", descricao: "Camiseta ajustada ao corpo com acabamento premium", categoria: "top", estilos: ["casual", "minimalista", "classico"], precoMin: 39, precoMax: 69, cores: ["#ffffff", "#000000", "#2c3e50", "#7f8c8d"], tecido: "algodão", corte: "slim", generos: ["masculino", "feminino", "unissex"], outfitType: "tshirt", outfitMaterial: "algodao", outfitFit: "slim", lojas: ["Hering", "Reserva", "Insider"] },
  { nome: "Camisa social de linho com manga longa", descricao: "Camisa elegante de linho com textura natural", categoria: "top", estilos: ["elegante", "classico", "minimalista"], precoMin: 89, precoMax: 179, cores: ["#ffffff", "#d4c5a9", "#1a1a2e", "#4a6741"], tecido: "linho", corte: "regular", generos: ["masculino", "unissex"], outfitType: "camisa", outfitMaterial: "linho", outfitFit: "regular", lojas: ["Zara", "Aramis", "Reserva"] },
  { nome: "Blazer estruturado de alfaiataria", descricao: "Blazer com corte moderno e ombros levemente estruturados", categoria: "top", estilos: ["elegante", "classico"], precoMin: 189, precoMax: 349, cores: ["#1a1a2e", "#2c3e50", "#3d3d3d", "#8b7355"], tecido: "lã mista", corte: "regular", generos: ["masculino", "feminino", "unissex"], outfitType: "blazer", outfitMaterial: "la", outfitFit: "regular", lojas: ["Zara", "Renner", "C&A"] },
  { nome: "Moletom hoodie com capuz oversized", descricao: "Moletom confortável com capuz e bolso canguru", categoria: "top", estilos: ["streetwear", "casual", "urbano", "esportivo"], precoMin: 79, precoMax: 149, cores: ["#1a1a2e", "#3d3d3d", "#4a148c", "#1b5e20"], tecido: "moletom", corte: "oversized", generos: ["masculino", "feminino", "unissex"], outfitType: "moletom", outfitMaterial: "algodao", outfitFit: "oversized", lojas: ["Nike", "Adidas", "Renner"] },
  { nome: "Jaqueta corta-vento esportiva", descricao: "Jaqueta leve com zíper e punho elástico", categoria: "top", estilos: ["esportivo", "streetwear", "urbano"], precoMin: 119, precoMax: 199, cores: ["#000000", "#1a237e", "#b71c1c", "#004d40"], tecido: "nylon", corte: "regular", generos: ["masculino", "feminino", "unissex"], outfitType: "jaqueta", outfitMaterial: "sintetico", outfitFit: "regular", lojas: ["Decathlon", "Nike", "Centauro"] },
  { nome: "Regata de malha canelada", descricao: "Regata com textura canelada e caimento suave", categoria: "top", estilos: ["casual", "esportivo", "boho"], precoMin: 29, precoMax: 59, cores: ["#ffffff", "#f5f5dc", "#d4a373", "#000000"], tecido: "malha", corte: "slim", generos: ["feminino", "unissex"], outfitType: "regata", outfitMaterial: "algodao", outfitFit: "slim", lojas: ["Renner", "Riachuelo", "C&A"] },
  { nome: "Suéter de tricot com gola V", descricao: "Suéter clássico de tricot em lã mista", categoria: "top", estilos: ["classico", "preppy", "elegante", "vintage"], precoMin: 99, precoMax: 179, cores: ["#1a1a2e", "#8b0000", "#2f4f4f", "#f5f5dc"], tecido: "tricot", corte: "regular", generos: ["masculino", "feminino", "unissex"], outfitType: "sueter", outfitMaterial: "la", outfitFit: "regular", lojas: ["Zara", "Reserva", "Renner"] },
  { nome: "Cropped de ribana com manga curta", descricao: "Cropped ajustado em ribana com acabamento premium", categoria: "top", estilos: ["casual", "streetwear", "romantico", "boho"], precoMin: 35, precoMax: 69, cores: ["#ffffff", "#ffb6c1", "#000000", "#d2b48c"], tecido: "ribana", corte: "slim", generos: ["feminino"], outfitType: "cropped", outfitMaterial: "algodao", outfitFit: "slim", lojas: ["Shein", "Renner", "C&A"] },
  { nome: "Camisa de flanela xadrez", descricao: "Camisa de flanela macia com estampa xadrez", categoria: "top", estilos: ["grunge", "vintage", "casual", "urbano"], precoMin: 69, precoMax: 129, cores: ["#8b0000", "#1a1a2e", "#2f4f4f", "#8b4513"], tecido: "flanela", corte: "regular", generos: ["masculino", "feminino", "unissex"], outfitType: "camisa", outfitMaterial: "algodao", outfitFit: "regular", lojas: ["Renner", "Riachuelo", "Hering"] },
  { nome: "Jaqueta jeans trucker clássica", descricao: "Jaqueta jeans com botões de metal e bolsos frontais", categoria: "top", estilos: ["casual", "streetwear", "vintage", "urbano"], precoMin: 129, precoMax: 229, cores: ["#4682b4", "#1a1a2e", "#f5f5dc"], tecido: "jeans", corte: "regular", generos: ["masculino", "feminino", "unissex"], outfitType: "jaqueta", outfitMaterial: "jeans", outfitFit: "regular", lojas: ["Levi's", "Renner", "C&A"] },
  { nome: "Polo de piquet com logo bordado", descricao: "Polo clássica em piquet com acabamento refinado", categoria: "top", estilos: ["preppy", "classico", "casual", "esportivo"], precoMin: 69, precoMax: 139, cores: ["#ffffff", "#1a237e", "#006400", "#800020"], tecido: "piquet", corte: "regular", generos: ["masculino", "unissex"], outfitType: "camisa", outfitMaterial: "algodao", outfitFit: "regular", lojas: ["Lacoste", "Reserva", "Polo Ralph Lauren"] },

  // === BOTTOMS ===
  { nome: "Calça jeans slim fit com elastano", descricao: "Jeans escuro com leve elastano para conforto", categoria: "bottom", estilos: ["casual", "streetwear", "urbano", "classico"], precoMin: 89, precoMax: 169, cores: ["#1a1a2e", "#2c3e50", "#191970"], tecido: "jeans", corte: "slim", generos: ["masculino", "feminino", "unissex"], outfitType: "calca", outfitMaterial: "jeans", outfitFit: "slim", lojas: ["Levi's", "Renner", "Zara"] },
  { nome: "Calça de alfaiataria reta com vinco", descricao: "Calça social com caimento reto e vinco frontal", categoria: "bottom", estilos: ["elegante", "classico", "minimalista"], precoMin: 129, precoMax: 249, cores: ["#1a1a2e", "#2c3e50", "#3d3d3d", "#d4c5a9"], tecido: "lã mista", corte: "regular", generos: ["masculino", "feminino", "unissex"], outfitType: "calca", outfitMaterial: "algodao", outfitFit: "regular", lojas: ["Zara", "Aramis", "Renner"] },
  { nome: "Jogger de moletom com punho canelado", descricao: "Calça jogger confortável com bolsos laterais", categoria: "bottom", estilos: ["esportivo", "streetwear", "casual", "urbano"], precoMin: 69, precoMax: 129, cores: ["#1a1a2e", "#2d2d2d", "#4a148c", "#1b5e20"], tecido: "moletom", corte: "regular", generos: ["masculino", "feminino", "unissex"], outfitType: "jogger", outfitMaterial: "algodao", outfitFit: "regular", lojas: ["Nike", "Adidas", "Renner"] },
  { nome: "Shorts de sarja com barra dobrada", descricao: "Bermuda de sarja com comprimento acima do joelho", categoria: "bottom", estilos: ["casual", "esportivo", "boho"], precoMin: 59, precoMax: 109, cores: ["#d4c5a9", "#2c3e50", "#f5f5dc", "#556b2f"], tecido: "sarja", corte: "regular", generos: ["masculino", "feminino", "unissex"], outfitType: "shorts", outfitMaterial: "algodao", outfitFit: "regular", lojas: ["Renner", "Riachuelo", "C&A"] },
  { nome: "Saia midi plissada fluida", descricao: "Saia plissada com caimento fluido até o meio da canela", categoria: "bottom", estilos: ["elegante", "romantico", "boho", "classico"], precoMin: 89, precoMax: 169, cores: ["#1a1a2e", "#800020", "#2f4f4f", "#d4c5a9"], tecido: "crepe", corte: "regular", generos: ["feminino"], outfitType: "saia_longa", outfitMaterial: "seda", outfitFit: "regular", lojas: ["Zara", "Renner", "Amaro"] },
  { nome: "Calça wide leg de linho", descricao: "Calça pantalona de linho com cintura alta", categoria: "bottom", estilos: ["boho", "minimalista", "elegante", "romantico"], precoMin: 99, precoMax: 189, cores: ["#f5f5dc", "#ffffff", "#d4c5a9", "#2f4f4f"], tecido: "linho", corte: "wide", generos: ["feminino", "unissex"], outfitType: "calca", outfitMaterial: "algodao", outfitFit: "wide", lojas: ["Zara", "Farm", "Amaro"] },
  { nome: "Calça cargo com bolsos laterais", descricao: "Calça cargo em sarja com múltiplos bolsos utilitários", categoria: "bottom", estilos: ["streetwear", "urbano", "grunge"], precoMin: 99, precoMax: 179, cores: ["#3d3d3d", "#556b2f", "#1a1a2e", "#8b4513"], tecido: "sarja", corte: "regular", generos: ["masculino", "feminino", "unissex"], outfitType: "calca", outfitMaterial: "algodao", outfitFit: "regular", lojas: ["Renner", "Riachuelo", "Shein"] },
  { nome: "Saia curta de couro sintético", descricao: "Mini saia em couro ecológico com zíper lateral", categoria: "bottom", estilos: ["grunge", "streetwear", "romantico"], precoMin: 79, precoMax: 139, cores: ["#000000", "#800020", "#1a1a2e"], tecido: "couro sintético", corte: "slim", generos: ["feminino"], outfitType: "saia", outfitMaterial: "couro", outfitFit: "slim", lojas: ["Zara", "Renner", "C&A"] },
  { nome: "Legging de suplex com cintura alta", descricao: "Legging modeladora com tecnologia de compressão", categoria: "bottom", estilos: ["esportivo", "casual"], precoMin: 49, precoMax: 99, cores: ["#000000", "#1a237e", "#4a148c"], tecido: "suplex", corte: "slim", generos: ["feminino"], outfitType: "legging", outfitMaterial: "sintetico", outfitFit: "slim", lojas: ["Live!", "Centauro", "Decathlon"] },

  // === SHOES ===
  { nome: "Tênis casual branco de couro", descricao: "Tênis minimalista branco com solado emborrachado", categoria: "shoes", estilos: ["casual", "minimalista", "streetwear", "urbano"], precoMin: 149, precoMax: 299, cores: ["#ffffff", "#f5f5dc"], tecido: "couro", corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "tenis", outfitMaterial: "couro", outfitFit: "regular", lojas: ["Adidas", "Nike", "Netshoes"] },
  { nome: "Bota Chelsea de couro com elástico lateral", descricao: "Bota Chelsea clássica com bico arredondado", categoria: "shoes", estilos: ["elegante", "classico", "grunge", "urbano"], precoMin: 199, precoMax: 399, cores: ["#1a1a2e", "#3d3d3d", "#8b4513"], tecido: "couro", corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "bota", outfitMaterial: "couro", outfitFit: "regular", lojas: ["Democrata", "Ferracini", "Arezzo"] },
  { nome: "Sapato social Derby de couro polido", descricao: "Sapato social com acabamento brilhante e sola de borracha", categoria: "shoes", estilos: ["elegante", "classico"], precoMin: 179, precoMax: 349, cores: ["#1a1a2e", "#3d3d3d", "#8b4513"], tecido: "couro", corte: null, generos: ["masculino", "unissex"], outfitType: "sapato_social", outfitMaterial: "couro", outfitFit: "regular", lojas: ["Democrata", "Ferracini", "Di Pollini"] },
  { nome: "Tênis esportivo de corrida com amortecimento", descricao: "Tênis com tecnologia de amortecimento e mesh respirável", categoria: "shoes", estilos: ["esportivo", "casual", "streetwear"], precoMin: 199, precoMax: 399, cores: ["#000000", "#1a237e", "#b71c1c", "#ffffff"], tecido: "mesh", corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "tenis", outfitMaterial: "sintetico", outfitFit: "regular", lojas: ["Nike", "Adidas", "Centauro"] },
  { nome: "Sandália de tiras de couro", descricao: "Sandália rasteira com tiras de couro natural", categoria: "shoes", estilos: ["boho", "casual", "romantico"], precoMin: 79, precoMax: 159, cores: ["#d4a373", "#8b4513", "#000000"], tecido: "couro", corte: null, generos: ["feminino", "unissex"], outfitType: "sandalia", outfitMaterial: "couro", outfitFit: "regular", lojas: ["Arezzo", "Melissa", "Havaianas"] },
  { nome: "Bota coturno de couro com cadarço", descricao: "Coturno robusto com solado tratorado e cadarço", categoria: "shoes", estilos: ["grunge", "streetwear", "urbano"], precoMin: 199, precoMax: 349, cores: ["#000000", "#1a1a2e", "#3d3d3d"], tecido: "couro", corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "bota", outfitMaterial: "couro", outfitFit: "regular", lojas: ["Dr. Martens", "Renner", "Zattini"] },
  { nome: "Mocassim de camurça com sola flexível", descricao: "Mocassim confortável de camurça com costura aparente", categoria: "shoes", estilos: ["classico", "preppy", "casual", "elegante"], precoMin: 139, precoMax: 259, cores: ["#8b4513", "#2f4f4f", "#1a1a2e", "#d4c5a9"], tecido: "camurça", corte: null, generos: ["masculino", "unissex"], outfitType: "mocassim", outfitMaterial: "camurca", outfitFit: "regular", lojas: ["Democrata", "Reserva", "Ferracini"] },
  { nome: "Sapatilha de bico fino com laço", descricao: "Sapatilha delicada com bico fino e detalhe de laço", categoria: "shoes", estilos: ["romantico", "classico", "elegante", "preppy"], precoMin: 89, precoMax: 169, cores: ["#000000", "#ffb6c1", "#f5f5dc", "#800020"], tecido: "couro sintético", corte: null, generos: ["feminino"], outfitType: "sapatilha", outfitMaterial: "sintetico", outfitFit: "regular", lojas: ["Arezzo", "Schutz", "Renner"] },

  // === ACCESSORIES ===
  { nome: "Relógio analógico com pulseira de couro", descricao: "Relógio elegante com mostrador minimalista", categoria: "accessory", estilos: ["elegante", "classico", "minimalista", "casual"], precoMin: 79, precoMax: 199, cores: ["#c0c0c0", "#ffd700", "#1a1a2e"], tecido: null, corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "relogio", outfitMaterial: "couro", outfitFit: "regular", lojas: ["Casio", "Technos", "Amazon"] },
  { nome: "Boné aba reta de algodão", descricao: "Boné estruturado com aba reta e ajuste snapback", categoria: "accessory", estilos: ["streetwear", "esportivo", "urbano", "casual"], precoMin: 39, precoMax: 79, cores: ["#000000", "#1a237e", "#b71c1c", "#ffffff"], tecido: null, corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "bone", outfitMaterial: "algodao", outfitFit: "regular", lojas: ["New Era", "Nike", "Renner"] },
  { nome: "Colar corrente dourada minimalista", descricao: "Colar fino de corrente dourada com fecho camarão", categoria: "accessory", estilos: ["elegante", "minimalista", "romantico", "casual"], precoMin: 29, precoMax: 79, cores: ["#ffd700", "#c0c0c0"], tecido: null, corte: null, generos: ["feminino", "unissex"], outfitType: "colar", outfitMaterial: "sintetico", outfitFit: "regular", lojas: ["Vivara", "Riachuelo", "Renner"] },
  { nome: "Óculos de sol com armação retrô", descricao: "Óculos de sol com lentes escuras e armação acetato", categoria: "accessory", estilos: ["casual", "streetwear", "vintage", "boho", "urbano"], precoMin: 49, precoMax: 129, cores: ["#1a1a2e", "#8b4513", "#000000"], tecido: null, corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "oculos", outfitMaterial: "sintetico", outfitFit: "regular", lojas: ["Chilli Beans", "Ray-Ban", "Renner"] },
  { nome: "Cinto de couro com fivela prata", descricao: "Cinto de couro legítimo com fivela de metal escovado", categoria: "accessory", estilos: ["casual", "elegante", "classico", "urbano"], precoMin: 49, precoMax: 119, cores: ["#1a1a2e", "#8b4513", "#000000"], tecido: null, corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "cinto", outfitMaterial: "couro", outfitFit: "regular", lojas: ["Renner", "C&A", "Zara"] },
  { nome: "Bolsa transversal compacta de couro", descricao: "Bolsa crossbody com alça ajustável e zíper", categoria: "accessory", estilos: ["casual", "urbano", "streetwear", "minimalista"], precoMin: 69, precoMax: 159, cores: ["#000000", "#1a1a2e", "#8b4513", "#d4c5a9"], tecido: null, corte: null, generos: ["feminino", "unissex"], outfitType: "bolsa", outfitMaterial: "couro", outfitFit: "regular", lojas: ["Arezzo", "Renner", "Zara"] },
  { nome: "Pulseira de aço inoxidável", descricao: "Pulseira masculina de aço com fecho magnético", categoria: "accessory", estilos: ["casual", "streetwear", "elegante", "urbano"], precoMin: 29, precoMax: 69, cores: ["#c0c0c0", "#1a1a2e", "#ffd700"], tecido: null, corte: null, generos: ["masculino", "unissex"], outfitType: "pulseira", outfitMaterial: "sintetico", outfitFit: "regular", lojas: ["Vivara", "Amazon", "Renner"] },
  { nome: "Mochila urbana de nylon impermeável", descricao: "Mochila funcional com compartimento para notebook", categoria: "accessory", estilos: ["streetwear", "urbano", "esportivo", "casual"], precoMin: 89, precoMax: 179, cores: ["#000000", "#1a237e", "#2f4f4f"], tecido: null, corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "mochila", outfitMaterial: "sintetico", outfitFit: "regular", lojas: ["Herschel", "Nike", "Decathlon"] },
  { nome: "Chapéu bucket hat de algodão", descricao: "Chapéu bucket clássico com aba curta", categoria: "accessory", estilos: ["streetwear", "boho", "casual", "urbano"], precoMin: 35, precoMax: 69, cores: ["#000000", "#f5f5dc", "#556b2f", "#1a1a2e"], tecido: null, corte: null, generos: ["masculino", "feminino", "unissex"], outfitType: "chapeu", outfitMaterial: "algodao", outfitFit: "regular", lojas: ["Renner", "C&A", "Amazon"] },
  { nome: "Brincos argola dourada média", descricao: "Brincos de argola em banho de ouro 18k", categoria: "accessory", estilos: ["elegante", "casual", "romantico", "boho"], precoMin: 25, precoMax: 69, cores: ["#ffd700", "#c0c0c0"], tecido: null, corte: null, generos: ["feminino"], outfitType: "brinco", outfitMaterial: "sintetico", outfitFit: "regular", lojas: ["Vivara", "Riachuelo", "Renner"] },
];

const PALETAS: Record<string, string[][]> = {
  casual: [["#2c3e50", "#f5f5dc", "#8b4513"], ["#1a1a2e", "#ffffff", "#c0c0c0"], ["#556b2f", "#d4c5a9", "#3d3d3d"]],
  streetwear: [["#1a1a2e", "#b71c1c", "#ffffff"], ["#000000", "#4a148c", "#c0c0c0"], ["#1a237e", "#ffd700", "#2d2d2d"]],
  elegante: [["#1a1a2e", "#d4c5a9", "#ffd700"], ["#2c3e50", "#ffffff", "#c0c0c0"], ["#800020", "#f5f5dc", "#3d3d3d"]],
  esportivo: [["#1a237e", "#ffffff", "#b71c1c"], ["#000000", "#1b5e20", "#f5f5dc"], ["#004d40", "#ffd700", "#2d2d2d"]],
  minimalista: [["#000000", "#ffffff", "#7f8c8d"], ["#2c3e50", "#f5f5dc", "#c0c0c0"], ["#3d3d3d", "#ffffff", "#d4c5a9"]],
  boho: [["#d4a373", "#556b2f", "#f5f5dc"], ["#8b4513", "#d4c5a9", "#2f4f4f"], ["#a0522d", "#f5f5dc", "#556b2f"]],
  vintage: [["#8b0000", "#f5f5dc", "#8b4513"], ["#2f4f4f", "#d4c5a9", "#1a1a2e"], ["#800020", "#d4a373", "#3d3d3d"]],
  classico: [["#1a1a2e", "#ffffff", "#8b4513"], ["#2c3e50", "#d4c5a9", "#c0c0c0"], ["#3d3d3d", "#f5f5dc", "#ffd700"]],
  romantico: [["#ffb6c1", "#f5f5dc", "#ffd700"], ["#800020", "#ffffff", "#d4c5a9"], ["#dda0dd", "#f5f5dc", "#c0c0c0"]],
  grunge: [["#000000", "#8b0000", "#3d3d3d"], ["#1a1a2e", "#556b2f", "#2d2d2d"], ["#3d3d3d", "#8b4513", "#000000"]],
  preppy: [["#1a237e", "#ffffff", "#006400"], ["#800020", "#f5f5dc", "#1a237e"], ["#006400", "#ffffff", "#ffd700"]],
  urbano: [["#1a1a2e", "#3d3d3d", "#c0c0c0"], ["#000000", "#4682b4", "#ffffff"], ["#2d2d2d", "#1a237e", "#f5f5dc"]],
};

const NOMES_LOOKS: Record<string, string[]> = {
  casual: ["Conforto Urbano", "Easy Day", "Relax Chic"],
  streetwear: ["Urban Flow", "Night Rider", "Street King"],
  elegante: ["Noir Elegance", "Golden Hour", "Classic Luxe"],
  esportivo: ["Active Pro", "Sport Vibes", "Dynamic Edge"],
  minimalista: ["Less is More", "Pure Lines", "Zen Mode"],
  boho: ["Free Spirit", "Earth Vibes", "Bohemian Soul"],
  vintage: ["Retro Wave", "Old School Cool", "Time Travel"],
  classico: ["Timeless Class", "Heritage Style", "Refined Touch"],
  romantico: ["Rose Garden", "Soft Glow", "Sweet Elegance"],
  grunge: ["Dark Edge", "Raw Power", "Rebel Soul"],
  preppy: ["Campus Elite", "Ivy League", "Smart Casual"],
  urbano: ["City Walker", "Metro Style", "Concrete Jungle"],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gerarLookOffline(input: LookInput, paleta: string[], nomeLook: string): LookGerado {
  const budget = input.orcamento;
  const genero = input.genero || "unissex";

  const filterPeca = (p: PecaDB) =>
    p.estilos.includes(input.estilo) &&
    (p.generos.includes(genero) || p.generos.includes("unissex"));

  const tops = shuffle(PECAS.filter((p) => p.categoria === "top" && filterPeca(p)));
  const bottoms = shuffle(PECAS.filter((p) => p.categoria === "bottom" && filterPeca(p)));
  const shoes = shuffle(PECAS.filter((p) => p.categoria === "shoes" && filterPeca(p)));
  const accessories = shuffle(PECAS.filter((p) => p.categoria === "accessory" && filterPeca(p)));

  const top = tops[0] || PECAS.find((p) => p.categoria === "top")!;
  const bottom = bottoms[0] || PECAS.find((p) => p.categoria === "bottom")!;
  const shoe = shoes[0] || PECAS.find((p) => p.categoria === "shoes")!;

  // Budget allocation
  const totalMax = top.precoMax + bottom.precoMax + shoe.precoMax;
  const ratio = Math.min(1, budget / totalMax);

  const topPreco = Math.round(top.precoMin + (top.precoMax - top.precoMin) * ratio);
  const bottomPreco = Math.round(bottom.precoMin + (bottom.precoMax - bottom.precoMin) * ratio);
  const shoePreco = Math.round(shoe.precoMin + (shoe.precoMax - shoe.precoMin) * ratio);
  const remaining = budget - topPreco - bottomPreco - shoePreco;

  const acc = accessories[0];
  const accPreco = acc ? Math.min(Math.round(acc.precoMin + (acc.precoMax - acc.precoMin) * ratio), Math.max(remaining, acc.precoMin)) : 0;
  const totalPreco = topPreco + bottomPreco + shoePreco + (acc ? Math.min(accPreco, remaining) : 0);

  const corTop = pickRandom(top.cores.filter((c) => paleta.some((p) => p === c)) || top.cores);
  const corBottom = pickRandom(bottom.cores.filter((c) => paleta.some((p) => p === c)) || bottom.cores);
  const corShoe = pickRandom(shoe.cores);
  const corAcc = acc ? pickRandom(acc.cores) : "#c0c0c0";

  // Build a short English query for photo search based on name + cut + fabric
  function buildQuery(p: PecaDB, cor: string): string {
    const colorMap: Record<string, string> = {
      "#ffffff": "white", "#000000": "black", "#1a1a2e": "dark navy", "#2c3e50": "dark blue",
      "#f5f5dc": "beige", "#d4c5a9": "beige", "#8b4513": "brown", "#c0392b": "red",
      "#ffd700": "gold", "#c0c0c0": "silver", "#4682b4": "blue", "#556b2f": "olive",
      "#800020": "burgundy", "#ffb6c1": "pink", "#4a148c": "purple",
    };
    const colorWord = colorMap[cor] || "";
    const parts = [colorWord, p.corte || "", p.tecido || "", p.nome.split(" ").slice(0, 3).join(" "), "fashion"]
      .filter(Boolean).join(" ");
    return parts.slice(0, 60);
  }

  const pecas: Array<{ categoria: "top" | "bottom" | "shoes" | "accessory"; nome: string; descricao: string; cor: string; preco: number; tecido?: string; corte?: string; lojas: string[]; imagemQuery: string }> = [
    { categoria: "top" as const, nome: top.nome, descricao: top.descricao, cor: corTop || pickRandom(top.cores), preco: topPreco, tecido: top.tecido || undefined, corte: top.corte || undefined, lojas: top.lojas, imagemQuery: buildQuery(top, corTop || top.cores[0]) },
    { categoria: "bottom" as const, nome: bottom.nome, descricao: bottom.descricao, cor: corBottom || pickRandom(bottom.cores), preco: bottomPreco, tecido: bottom.tecido || undefined, corte: bottom.corte || undefined, lojas: bottom.lojas, imagemQuery: buildQuery(bottom, corBottom || bottom.cores[0]) },
    { categoria: "shoes" as const, nome: shoe.nome, descricao: shoe.descricao, cor: corShoe || pickRandom(shoe.cores), preco: shoePreco, tecido: shoe.tecido || undefined, corte: shoe.corte || undefined, lojas: shoe.lojas, imagemQuery: buildQuery(shoe, corShoe || shoe.cores[0]) },
  ];

  if (acc && remaining > 0) {
    pecas.push({ categoria: "accessory" as const, nome: acc.nome, descricao: acc.descricao, cor: corAcc, preco: Math.min(accPreco, remaining), tecido: acc.tecido || undefined, corte: acc.corte || undefined, lojas: acc.lojas, imagemQuery: buildQuery(acc, corAcc) });
  }

  const outfitJson: OutfitJson = {
    top: { type: top.outfitType, color: pecas[0].cor, material: top.outfitMaterial, fit: top.outfitFit },
    bottom: { type: bottom.outfitType, color: pecas[1].cor, material: bottom.outfitMaterial, fit: bottom.outfitFit },
    shoes: { type: shoe.outfitType, color: pecas[2].cor, material: shoe.outfitMaterial },
    accessories: acc ? [{ type: acc.outfitType, color: corAcc }] : [],
  };

  return {
    nome: nomeLook,
    descricao: `${top.nome} combinada com ${bottom.nome.toLowerCase()} e ${shoe.nome.toLowerCase()}${acc ? `, completando com ${acc.nome.toLowerCase()}` : ""}. Um visual ${input.estilo} ideal para ${input.ocasiao}.`,
    estilo: input.estilo,
    ocasiao: input.ocasiao,
    genero: input.genero,
    precoEstimado: Math.min(totalPreco, budget),
    orcamento: budget,
    explicacao: `Este look traz ${top.nome.toLowerCase()} em ${top.tecido || "tecido premium"} com ${bottom.nome.toLowerCase()} de ${bottom.tecido || "tecido versátil"}, criando um visual ${input.estilo} coeso. ${shoe.nome} completa o look com ${shoe.tecido || "material de qualidade"}.${acc ? ` O toque final fica por conta de ${acc.nome.toLowerCase()}.` : ""} Perfeito para ${input.ocasiao} com conforto e personalidade.`,
    cores: paleta,
    pecas,
    outfitJson,
  };
}

function gerarLooksOffline(input: LookInput): LookGerado[] {
  const paletas = PALETAS[input.estilo] || PALETAS.casual;
  const nomes = shuffle(NOMES_LOOKS[input.estilo] || NOMES_LOOKS.casual);

  return [0, 1, 2].map((i) =>
    gerarLookOffline(input, paletas[i % paletas.length], nomes[i % nomes.length])
  );
}

// ==================== MAIN EXPORT ====================

export async function gerarLooks(input: LookInput): Promise<LookGerado[]> {
  // Try Anthropic API first, fallback to offline engine
  try {
    const anthropic = new Anthropic();

    const prompt = `Você é um stylist profissional brasileiro. Monte exatamente 3 looks completos.

DADOS: Estilo: ${input.estilo} | Ocasião: ${input.ocasiao} | Orçamento: R$${input.orcamento}${input.genero ? ` | Gênero: ${input.genero}` : ""}${input.preferencias ? ` | Preferências: ${input.preferencias}` : ""}

TABELA DE PREÇOS REAIS BR 2024 (use como referência):
- Camiseta básica: Renner/C&A R$39-89 | Zara R$99-199 | Reserva/Hering R$59-129
- Calça jeans: Renner R$89-169 | Levi's R$199-399 | Zara R$149-299 | C&A R$69-139
- Tênis casual: Renner R$99-179 | Adidas Originals R$299-549 | Nike R$299-699 | Shein R$59-119
- Jaqueta/blazer: C&A R$89-189 | Zara R$199-499 | Renner R$129-249
- Bota/sapato: Arezzo R$199-499 | Democrata R$179-349 | Renner R$99-199
- Acessório simples: Renner/C&A R$19-69 | Vivara R$89-399
- Bolsa: Arezzo R$199-499 | Renner R$59-149

REGRAS:
- Cada look: top + bottom + shoes + 1 acessório
- Preço total de cada look <= R$${input.orcamento}. Distribua proporcionalmente.
- Cores em hex. 3 looks visualmente diferentes entre si.
- OBRIGATÓRIO em CADA peça: "lojas" (2-3 lojas BR reais) e "imagemQuery" (5-8 palavras em INGLÊS descrevendo a peça para busca de foto, ex: "white slim fit linen blazer women")

Responda APENAS JSON válido (sem markdown):
[{"nome":"...","descricao":"...","estilo":"${input.estilo}","ocasiao":"${input.ocasiao}","genero":${input.genero ? `"${input.genero}"` : "null"},"precoEstimado":0,"orcamento":${input.orcamento},"explicacao":"...","cores":["#hex"],"pecas":[{"categoria":"top|bottom|shoes|accessory","nome":"...","descricao":"...","cor":"#hex","preco":0,"tecido":"...","corte":"slim|regular|oversized|wide|null","detalhes":"...","lojas":["Loja1","Loja2"],"imagemQuery":"..."}],"outfitJson":{"top":{"type":"tshirt|camisa|jaqueta|moletom|regata|blazer|cropped|sueter","color":"#hex","material":"algodao|seda|couro|jeans|linho|sintetico|la","fit":"slim|regular|oversized"},"bottom":{"type":"calca|shorts|saia|saia_longa|jogger|legging","color":"#hex","material":"jeans|algodao|couro|seda|sintetico","fit":"slim|regular|wide"},"shoes":{"type":"tenis|bota|sapato_social|sandalia|salto|mocassim|sapatilha","color":"#hex","material":"couro|camurca|sintetico|tecido"},"accessories":[{"type":"chapeu|bone|colar|pulseira|relogio|bolsa|oculos|brinco|cinto|anel|lenco|mochila","color":"#hex"}]}}]`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Resposta inesperada");

    // Strip any accidental markdown fences before parsing
    const cleaned = content.text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // Fallback to offline rule-based engine
    console.log("API indisponível, usando engine offline");
    return gerarLooksOffline(input);
  }
}
