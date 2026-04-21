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
  // coque = bun — default when no specific style is set
  const isBun     = hs.includes("coque")  || hs.includes("bun")    || hs.includes("preso") || (!isLong && !isCurly && !isBald);
  const hairMat   = useMemo(() => ({ color: hairColor, roughness: 0.85, metalness: 0 }), [hairColor]);

  // Model: feet at Y≈0, head top at Y≈1.656, head center ≈ Y 1.56
  const headY = 1.595; // center of head
  const headR = 0.100; // approx head radius at this model's scale

  return (
    <group>
      {/* ── Base model ── */}
      <primitive object={scene} />

      {/* ── Hair ── */}
      {!isBald && isBun && (
        <group position={[0, headY, 0]}>
          {/* ── Tight scalp layer — hair pulled back, hugs the skull ── */}
          {/* Top of skull (slightly thicker than head) */}
          <mesh scale={[1.01, 0.72, 1.01]}>
            <sphereGeometry args={[headR * 1.04, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          {/* Back of head — hair running to bun */}
          <mesh position={[0, 0.000, -headR * 0.88]}>
            <sphereGeometry args={[headR * 0.90, 36, 28]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          {/* Nape — back lower */}
          <mesh position={[0, -headR * 0.82, -headR * 0.72]} scale={[0.88, 0.60, 0.75]}>
            <sphereGeometry args={[headR, 28, 22]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          {/* Temples sides */}
          {([-1, 1] as const).map((s, i) => (
            <mesh key={i} position={[s * headR * 0.92, -0.012, -0.015]} scale={[0.52, 0.70, 0.55]}>
              <sphereGeometry args={[headR, 20, 16]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
          ))}

          {/* ── Bun at crown ── */}
          {/* Main bun body — flattened dome sitting at top-back of skull */}
          <group position={[0, headR * 0.62, -headR * 0.28]}>
            {/* Core bun sphere */}
            <mesh scale={[1.0, 0.62, 1.0]}>
              <sphereGeometry args={[0.062, 36, 28]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
            {/* Outer wrap ring — gives the "twisted" bun look */}
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.52]}>
              <torusGeometry args={[0.044, 0.018, 14, 36]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
            {/* Second wrap ring — slightly larger, offset */}
            <mesh rotation={[Math.PI / 2, 0.38, 0]} scale={[1.12, 1.12, 0.48]}>
              <torusGeometry args={[0.038, 0.013, 12, 32]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
            {/* Hair tie */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.002]}>
              <torusGeometry args={[0.048, 0.004, 8, 32]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.1} />
            </mesh>
          </group>

          {/* ── Wispy strands at temples (natural) ── */}
          {([-1, 1] as const).map((s, i) => (
            <mesh key={i}
              position={[s * headR * 0.82, -headR * 0.28, headR * 0.72]}
              rotation={[0.28, s * 0.18, 0]}
              scale={[0.28, 1, 0.22]}
            >
              <capsuleGeometry args={[0.010, 0.058, 6, 10]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
          ))}
        </group>
      )}

      {/* Other styles fallback */}
      {!isBald && !isBun && (
        <group position={[0, headY, 0]}>
          <mesh scale={[1.02, isLong ? 0.86 : 0.82, 1.02]}>
            <sphereGeometry args={[headR * 1.04, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.60]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          <mesh position={[0, -headR * 0.68, -headR * 0.58]} scale={isLong ? [1, 1.80, 1] : [1, 1, 1]}>
            <sphereGeometry args={[headR * 0.98, 28, 22]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          {isLong && (
            <mesh position={[0, -headR * 2.20, -headR * 0.72]}>
              <capsuleGeometry args={[0.062, 0.260, 10, 18]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
          )}
          {isCurly && ([[-0.100, 0.018], [0, 0.042], [0.100, 0.018]] as const).map(([x, z], i) => (
            <mesh key={i} position={[x, headR * 0.5, z]}>
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
