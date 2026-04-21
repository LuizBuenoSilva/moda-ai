"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AvatarAppearance } from "./AvatarModel";
import { Outfit3DParams } from "@/lib/outfit-to-3d";
import { ShoesMesh } from "./ClothingParts";

useGLTF.preload("/models/avatar-base.glb");

const HAIR_COLORS: Record<string, string> = {
  preto:    "#100c06", castanho: "#3a1a06", loiro:    "#b88808", ruivo:    "#701806",
  branco:   "#d0d0d0", cinza:    "#686868", azul:     "#0828a0", rosa:     "#c83898",
  vermelho: "#a00818", roxo:     "#500890", verde:    "#108030",
};

function matchHairColor(val?: string): string {
  if (!val) return HAIR_COLORS.castanho;
  const l = val.toLowerCase().trim();
  if (HAIR_COLORS[l]) return HAIR_COLORS[l];
  for (const k of Object.keys(HAIR_COLORS)) if (l.includes(k) || k.includes(l)) return HAIR_COLORS[k];
  return HAIR_COLORS.castanho;
}

interface Props {
  outfitParams: Outfit3DParams | null;
  appearance?: AvatarAppearance;
}

export default function GLBAvatar({ outfitParams, appearance }: Props) {
  // useGLTF throws a Promise → handled by <Suspense> in AvatarCanvas
  const { scene } = useGLTF("/models/avatar-base.glb");

  // Memoize materials so we don't recreate on every render
  const topMat    = useMemo(() => new THREE.MeshStandardMaterial({ color: outfitParams?.top.color    ?? "#6d28d9", roughness: 0.86, metalness: 0 }), [outfitParams?.top.color]);
  const bottomMat = useMemo(() => new THREE.MeshStandardMaterial({ color: outfitParams?.bottom.color ?? "#1e1e2e", roughness: 0.84, metalness: 0 }), [outfitParams?.bottom.color]);

  // Apply materials to matching meshes in the scene
  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow    = true;
      child.receiveShadow = true;

      const n = child.name.toLowerCase();
      if (n.includes("tshirt") || n.includes("shirt") || n.includes("sleeve") || n.includes("jacket") || n.includes("top")) {
        child.material = topMat;
      } else if (n.includes("pants") || n.includes("pant") || n.includes("trouser") || n.includes("jean") || n.includes("skirt")) {
        child.material = bottomMat;
      }
    });
  }, [scene, topMat, bottomMat]);

  // Hair
  const hairColor = matchHairColor(appearance?.hairColor);
  const hs        = (appearance?.hairStyle || "").toLowerCase();
  const isBald    = hs.includes("careca") || hs.includes("raspado");
  const isLong    = hs.includes("long")   || hs.includes("comprido");
  const isCurly   = hs.includes("cach")   || hs.includes("crespo") || hs.includes("afro");
  const hairMat   = useMemo(() => ({ color: hairColor, roughness: 0.88, metalness: 0 }), [hairColor]);

  // Model: feet at Y≈0, head top at Y≈1.656, head center ≈ Y 1.56
  // We place hair slightly above the head center
  const headY = 1.60;
  const hairR = 0.098;

  return (
    <group>
      {/* ── Base model ── */}
      <primitive object={scene} />

      {/* ── Hair ── */}
      {!isBald && (
        <group position={[0, headY, 0]}>
          {/* Top cap */}
          <mesh scale={isCurly ? [1.10, 1.02, 1.10] : [1.02, 0.82, 1.02]}>
            <sphereGeometry args={[isCurly ? hairR * 1.12 : hairR, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.60]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          {/* Back */}
          <mesh position={[0, -0.068, -0.058]} scale={isLong ? [1, 1.65, 1] : [1, 1, 1]}>
            <sphereGeometry args={[isCurly ? hairR * 1.10 : hairR * 0.98, 28, 22]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          {/* Sides */}
          {([-1, 1] as const).map((s, i) => (
            <mesh key={i} position={[s * 0.054, -0.024, -0.020]}>
              <sphereGeometry args={[isCurly ? hairR * 0.98 : hairR * 0.88, 18, 14, s < 0 ? 0 : Math.PI, Math.PI, 0, Math.PI * 0.72]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
          ))}
          {/* Long hair strand */}
          {isLong && (
            <mesh position={[0, -0.200, -0.072]}>
              <capsuleGeometry args={[0.062, 0.240, 10, 18]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
          )}
          {/* Curly puffs */}
          {isCurly && ([[-0.100, 0.018], [0, 0.042], [0.100, 0.018]] as const).map(([x, z], i) => (
            <mesh key={i} position={[x, hairR * 0.5, z]}>
              <sphereGeometry args={[0.052, 14, 12]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Shoes ── (model has no shoes, render on top) */}
      {outfitParams && (
        <ShoesMesh params={outfitParams.shoes} />
      )}
    </group>
  );
}
