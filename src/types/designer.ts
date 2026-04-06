export interface PecaDesignInput {
  tipo: string;
  estilo: string;
  inspiracao: string;
  cores: string;
  detalhes: string;
}

export interface PecaDesignGerada {
  nome: string;
  tipo: string;
  estilo: string;
  descricao: string;
  tecido: string;
  corte: string;
  textura: string;
  elementosVisuais: string;
  promptImagem: string;
  sugestaoUso: string;
  cores: string[];
  inspiracao?: string;
  svgSketch?: string;
}
