"use client";

import { Outfit3DParams } from "@/lib/outfit-to-3d";
import { TopMesh, BottomMesh, ShoesMesh, AccessoryMesh } from "./ClothingParts";

interface OutfitRendererProps {
  params: Outfit3DParams;
}

export default function OutfitRenderer({ params }: OutfitRendererProps) {
  return (
    <group>
      <TopMesh params={params.top} />
      <BottomMesh params={params.bottom} />
      <ShoesMesh params={params.shoes} />
      {params.accessories.map((acc, i) => (
        <AccessoryMesh key={i} params={acc} />
      ))}
    </group>
  );
}
