export interface LookInput {
  estilo: string;
  ocasiao: string;
  orcamento: number;
  genero?: string;
  preferencias?: string;
}

export interface PecaGerada {
  categoria: "top" | "bottom" | "shoes" | "accessory";
  nome: string;
  descricao: string;
  cor: string;
  preco: number;
  tecido?: string;
  corte?: string;
  detalhes?: string;
  lojas?: string[];
  /** Short English search query used to find a representative fashion photo */
  imagemQuery?: string;
}

export interface LookGerado {
  nome: string;
  descricao: string;
  estilo: string;
  ocasiao: string;
  genero?: string;
  precoEstimado: number;
  orcamento: number;
  explicacao: string;
  cores: string[];
  pecas: PecaGerada[];
  outfitJson: OutfitJson;
}

export interface OutfitJson {
  top: {
    type: string;
    color: string;
    secondaryColor?: string;
    material: string;
    fit: string;
    texture?: string;
  };
  bottom: {
    type: string;
    color: string;
    material: string;
    fit: string;
  };
  shoes: {
    type: string;
    color: string;
    material: string;
  };
  accessories: Array<{
    type: string;
    color: string;
  }>;
}
