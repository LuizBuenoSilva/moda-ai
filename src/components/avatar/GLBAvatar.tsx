"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AvatarAppearance } from "./AvatarModel";
import { Outfit3DParams } from "@/lib/outfit-to-3d";

useGLTF.preload("/models/avatar-base.glb");

const SKIN_TONES: Record<string, string> = {
  claro: "#f0c898", medio: "#c8905c", moreno: "#9a6030",
  escuro: "#623818", negro: "#3a1c08",
};

const HAIR_COLORS: Record<string, string> = {
  preto: "#100c06", castanho: "#3a1a06", loiro: "#b88808", ruivo: "#701806",
  branco: "#d0d0d0", cinza: "#686868", azul: "#0828a0", rosa: "#c83898",
  vermelho: "#a00818", roxo: "#500890", verde: "#108030",
};

function matchKey<T>(val: string | undefined, map: Record<string, T>): T | null {
  if (!val) return null;
  const l = val.toLowerCase().trim();
  if (map[l] !== undefined) return map[l];
  for (const k of Object.keys(map)) if (l.includes(k) || k.includes(l)) return map[k];
  return null;
}

interface Props {
  outfitParams: Outfit3DParams | null;
  appearance?: AvatarAppearance;
}

export default function GLBAvatar({ outfitParams, appearance }: Props) {
  const { scene } = useGLTF("/models/avatar-base.glb");

  // ── Find clothing meshes + real world bounding box ──────────────────────
  const { topMeshes, bottomMeshes, headY, headR } = useMemo(() => {
    const tops: THREE.Mesh[]    = [];
    const bottoms: THREE.Mesh[] = [];
    const fullBox = new THREE.Box3();

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow    = true;
      obj.receiveShadow = true;

      // Expand bounding box with every mesh
      const box = new THREE.Box3().setFromObject(obj);
      fullBox.union(box);

      const n = obj.name.toLowerCase();
      if (n.includes("tshirt") || n.includes("shirt") || n.includes("sleeve") || n.includes("blouse")) {
        tops.push(obj);
      } else if (n.includes("pants") || n.includes("pant") || n.includes("trouser") || n.includes("jean")) {
        bottoms.push(obj);
      }
    });

    // Head radius ≈ 6.5% of total height (anatomical ratio)
    const totalH = fullBox.max.y - fullBox.min.y;
    const headRadius = totalH * 0.065;
    // headY = top of model minus one head-radius = head centre
    const computedHeadY = fullBox.max.y - headRadius;

    return { topMeshes: tops, bottomMeshes: bottoms, headY: computedHeadY, headR: headRadius };
  }, [scene]);

  // ── Update clothing colours whenever outfit changes ──────────────────────
  const topColor    = outfitParams?.top.color    ?? "#6d28d9";
  const bottomColor = outfitParams?.bottom.color ?? "#1e1e2e";

  // Use refs to track created materials so we can dispose them
  const createdMats = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    // Dispose previously created materials
    createdMats.current.forEach((m) => m.dispose());
    createdMats.current = [];

    const makeMat = (color: string, roughness: number) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
      createdMats.current.push(m);
      return m;
    };

    topMeshes.forEach((mesh) => { mesh.material = makeMat(topColor, 0.86); });
    bottomMeshes.forEach((mesh) => { mesh.material = makeMat(bottomColor, 0.84); });

    return () => {
      createdMats.current.forEach((m) => m.dispose());
      createdMats.current = [];
    };
  }, [topMeshes, bottomMeshes, topColor, bottomColor]);

  // ── Skin tone tint ───────────────────────────────────────────────────────
  const skinKey = matchKey(appearance?.skinTone, SKIN_TONES);
  useEffect(() => {
    if (!skinKey) return;
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      if (!obj.name.toLowerCase().includes("base_female")) return;
      const mat = obj.material as THREE.MeshStandardMaterial;
      if (mat?.color) {
        mat.color.set(SKIN_TONES[skinKey]);
        mat.needsUpdate = true;
      }
    });
  }, [scene, skinKey]);

  // ── Hair ─────────────────────────────────────────────────────────────────
  const hairColor = matchKey(appearance?.hairColor, HAIR_COLORS) ?? HAIR_COLORS.castanho;
  const hs     = (appearance?.hairStyle || "").toLowerCase();
  const isBald = hs.includes("careca") || hs.includes("raspado");
  const isLong = hs.includes("long")   || hs.includes("comprido");
  const isCurly= hs.includes("cach")   || hs.includes("crespo") || hs.includes("afro");
  const isBun  = !isBald && !isLong && !isCurly;
  const hm = { color: hairColor, roughness: 0.84, metalness: 0 };

  const hR = headR;

  return (
    <group>
      <primitive object={scene} />

      {/* ════ BUN (coque) ════ */}
      {isBun && (
        <group>
          {/*
            KEY: all hair pieces are positioned BEHIND the head centre (negative Z offset)
            so they never overlap the face.
            Head centre = [0, headY, 0].  Face is at Z ≈ +hR*0.75.
            Safe zone for hair: Z < -hR*0.10
          */}

          {/* 1. Top coverage — sphere offset behind head, slightly above centre */}
          <mesh position={[0, headY + hR * 0.18, -hR * 0.38]} scale={[0.90, 0.58, 0.72]}>
            <sphereGeometry args={[hR, 36, 28]} />
            <meshStandardMaterial {...hm} />
          </mesh>

          {/* 2. Back/nape coverage */}
          <mesh position={[0, headY - hR * 0.18, -hR * 0.82]} scale={[0.82, 0.66, 0.60]}>
            <sphereGeometry args={[hR, 32, 22]} />
            <meshStandardMaterial {...hm} />
          </mesh>

          {/* 3. BUN at crown-back */}
          <group position={[0, headY + hR * 0.58, -hR * 0.30]}>
            {/* Bun core */}
            <mesh scale={[1.0, 0.66, 1.0]}>
              <sphereGeometry args={[hR * 0.44, 32, 24]} />
              <meshStandardMaterial {...hm} />
            </mesh>
            {/* Twist torus */}
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.48]}>
              <torusGeometry args={[hR * 0.30, hR * 0.11, 12, 32]} />
              <meshStandardMaterial {...hm} />
            </mesh>
            {/* Elastic hair tie */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[hR * 0.34, hR * 0.028, 8, 32]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.2} />
            </mesh>
          </group>
        </group>
      )}

      {/* ════ LONG ════ */}
      {isLong && (
        <group position={[0, headY, 0]}>
          <mesh scale={[1.01, 0.88, 1.01]}>
            <sphereGeometry args={[hR * 1.04, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          <mesh position={[0, -hR * 0.65, -hR * 0.52]} scale={[1, 1.78, 1]}>
            <sphereGeometry args={[hR * 0.96, 28, 22]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          <mesh position={[0, -hR * 1.80, -hR * 0.68]}>
            <capsuleGeometry args={[hR * 0.60, hR * 2.40, 10, 18]} />
            <meshStandardMaterial {...hm} />
          </mesh>
        </group>
      )}

      {/* ════ CURLY ════ */}
      {isCurly && (
        <group position={[0, headY, 0]}>
          <mesh scale={[1.14, 1.04, 1.14]}>
            <sphereGeometry args={[hR * 1.12, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          {([[-hR, hR * 0.5], [0, hR * 0.8], [hR, hR * 0.5]] as const).map(([x, z], i) => (
            <mesh key={i} position={[x, hR * 0.5, z]}>
              <sphereGeometry args={[hR * 0.48, 14, 12]} />
              <meshStandardMaterial {...hm} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
