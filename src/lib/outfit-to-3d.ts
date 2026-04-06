import { OutfitJson } from "@/types/look";

export interface MaterialParams {
  color: string;
  roughness: number;
  metalness: number;
}

export interface TopParams {
  type: string;
  color: string;
  secondaryColor?: string;
  material: MaterialParams;
  fit: number; // scale multiplier
  width: number;
  height: number;
  depth: number;
  sleeveLength: number;
}

export interface BottomParams {
  type: string;
  color: string;
  material: MaterialParams;
  fit: number;
  legRadius: number;
  legHeight: number;
  isSkirt: boolean;
}

export interface ShoesParams {
  type: string;
  color: string;
  material: MaterialParams;
  height: number;
  isBoot: boolean;
}

export interface AccessoryParams {
  type: string;
  color: string;
}

export interface Outfit3DParams {
  top: TopParams;
  bottom: BottomParams;
  shoes: ShoesParams;
  accessories: AccessoryParams[];
}

function getMaterialParams(materialName: string, color: string): MaterialParams {
  const materials: Record<string, Omit<MaterialParams, "color">> = {
    couro: { roughness: 0.4, metalness: 0.1 },
    seda: { roughness: 0.1, metalness: 0.05 },
    jeans: { roughness: 0.9, metalness: 0.0 },
    algodao: { roughness: 0.7, metalness: 0.0 },
    sintetico: { roughness: 0.3, metalness: 0.2 },
    linho: { roughness: 0.8, metalness: 0.0 },
    la: { roughness: 0.85, metalness: 0.0 },
    camurca: { roughness: 0.95, metalness: 0.0 },
    tecido: { roughness: 0.6, metalness: 0.0 },
  };
  const mat = materials[materialName] || { roughness: 0.5, metalness: 0.0 };
  return { color, ...mat };
}

function getFitScale(fit: string): number {
  switch (fit) {
    case "slim": return 0.85;
    case "oversized": return 1.15;
    case "wide": return 1.2;
    default: return 1.0;
  }
}

export function outfitToParams(outfit: OutfitJson): Outfit3DParams {
  const fitScale = getFitScale(outfit.top.fit);

  // Top dimensions based on type
  const topDimensions: Record<string, { w: number; h: number; d: number; sleeve: number }> = {
    tshirt: { w: 1.1, h: 0.85, d: 0.55, sleeve: 0.3 },
    camisa: { w: 1.05, h: 0.9, d: 0.5, sleeve: 0.6 },
    jaqueta: { w: 1.2, h: 1.0, d: 0.6, sleeve: 0.65 },
    moletom: { w: 1.15, h: 0.95, d: 0.6, sleeve: 0.6 },
    regata: { w: 1.0, h: 0.8, d: 0.5, sleeve: 0 },
    blazer: { w: 1.15, h: 0.95, d: 0.55, sleeve: 0.65 },
    cropped: { w: 1.0, h: 0.5, d: 0.5, sleeve: 0.2 },
    sueter: { w: 1.1, h: 0.9, d: 0.55, sleeve: 0.6 },
  };

  const topDim = topDimensions[outfit.top.type] || topDimensions.tshirt;

  const top: TopParams = {
    type: outfit.top.type,
    color: outfit.top.color,
    secondaryColor: outfit.top.secondaryColor,
    material: getMaterialParams(outfit.top.material, outfit.top.color),
    fit: fitScale,
    width: topDim.w * fitScale,
    height: topDim.h,
    depth: topDim.d * fitScale,
    sleeveLength: topDim.sleeve,
  };

  const bottomFit = getFitScale(outfit.bottom.fit);
  const isSkirt = outfit.bottom.type === "saia" || outfit.bottom.type === "saia_longa";
  const bottomHeight = outfit.bottom.type === "shorts" ? 0.45 : outfit.bottom.type === "saia" ? 0.5 : outfit.bottom.type === "saia_longa" ? 0.9 : 1.0;

  const bottom: BottomParams = {
    type: outfit.bottom.type,
    color: outfit.bottom.color,
    material: getMaterialParams(outfit.bottom.material, outfit.bottom.color),
    fit: bottomFit,
    legRadius: 0.2 * bottomFit,
    legHeight: bottomHeight,
    isSkirt,
  };

  const isBoot = outfit.shoes.type === "bota";
  const shoeHeight = isBoot ? 0.4 : outfit.shoes.type === "salto" ? 0.25 : 0.15;

  const shoes: ShoesParams = {
    type: outfit.shoes.type,
    color: outfit.shoes.color,
    material: getMaterialParams(outfit.shoes.material, outfit.shoes.color),
    height: shoeHeight,
    isBoot,
  };

  const accessories: AccessoryParams[] = (outfit.accessories || []).map((a) => ({
    type: a.type,
    color: a.color,
  }));

  return { top, bottom, shoes, accessories };
}
