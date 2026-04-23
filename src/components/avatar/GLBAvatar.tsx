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
  const { topMeshes, bottomMeshes, modelBottom, headR } = useMemo(() => {
    const tops: THREE.Mesh[]    = [];
    const bottoms: THREE.Mesh[] = [];
    const fullBox = new THREE.Box3();

    // Pass 1: build full bounding box of entire model
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      fullBox.union(new THREE.Box3().setFromObject(obj));
    });

    const totalH   = fullBox.max.y - fullBox.min.y;
    // Waist sits ~47% from floor; head starts at top ~17% of height
    const midY      = fullBox.min.y + totalH * 0.47;
    const headStartY = fullBox.max.y - totalH * 0.17;

    // Pass 2: classify meshes by Y-centre (position beats name guessing)
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow    = true;
      obj.receiveShadow = true;

      const n = obj.name.toLowerCase();
      // Skip body/skin, face features — they share a material that must not be overridden
      if (n.includes("base") || n.includes("eye") || n.includes("teeth") ||
          n.includes("tongue") || n.includes("hair") || n.includes("lash")) return;

      const box    = new THREE.Box3().setFromObject(obj);
      const centerY = (box.max.y + box.min.y) / 2;

      // Skip head area
      if (centerY > headStartY) return;

      if (centerY >= midY) {
        tops.push(obj);      // torso / arms → shirt color
      } else {
        bottoms.push(obj);   // legs / feet mesh → pants color
      }
    });

    const hR = totalH * 0.067;
    return {
      topMeshes:    tops,
      bottomMeshes: bottoms,
      modelBottom:  fullBox.min.y,
      headR:        hR,
    };
  }, [scene]);

  // ── Clothing colours ─────────────────────────────────────────────────────
  const topColor    = outfitParams?.top.color    ?? appearance?.shirtColor ?? "#6d28d9";
  const bottomColor = outfitParams?.bottom.color ?? appearance?.pantsColor ?? "#1e1e2e";
  const shoeColor   = outfitParams?.shoes.color  ?? appearance?.shoeColor  ?? "#ffffff";

  const topRoughness    = outfitParams?.top.material.roughness    ?? 0.86;
  const bottomRoughness = outfitParams?.bottom.material.roughness ?? 0.84;

  const createdMats = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    createdMats.current.forEach((m) => m.dispose());
    createdMats.current = [];

    const makeMat = (color: string, roughness: number) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
      createdMats.current.push(m);
      return m;
    };

    topMeshes.forEach((mesh)    => { mesh.material = makeMat(topColor, topRoughness); });
    bottomMeshes.forEach((mesh) => { mesh.material = makeMat(bottomColor, bottomRoughness); });

    return () => {
      createdMats.current.forEach((m) => m.dispose());
      createdMats.current = [];
    };
  }, [topMeshes, bottomMeshes, topColor, bottomColor, topRoughness, bottomRoughness]);

  // ── Skin tone tint ────────────────────────────────────────────────────────
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

  return (
    <group>
      <primitive object={scene} />

      {/* ════ SHOES — sneaker / boot silhouette ════ */}
      {([-1, 1] as const).map((side, i) => {
        const footX = side * 0.052;
        const floorY = modelBottom;
        const sc     = outfitParams?.shoes;
        const isBoot = sc?.isBoot ?? false;
        const bootH  = isBoot ? headR * 0.85 : 0;
        return (
          <group key={i}>
            {/* Sole */}
            <mesh position={[footX, floorY + 0.014, 0.022]} scale={[0.82, 0.14, 1.55]}>
              <capsuleGeometry args={[0.030, 0.068, 6, 14]} />
              <meshStandardMaterial color="#111111" roughness={0.9} metalness={0} />
            </mesh>
            {/* Upper */}
            <mesh position={[footX, floorY + 0.046, 0.022]} rotation={[-0.08, 0, 0]} scale={[0.78, 0.50, 1.42]}>
              <capsuleGeometry args={[0.030, 0.065, 8, 14]} />
              <meshStandardMaterial color={shoeColor} roughness={0.52} metalness={0.04} />
            </mesh>
            {/* Boot shaft */}
            {isBoot && (
              <mesh position={[footX, floorY + 0.046 + bootH * 0.50, 0.004]} scale={[0.76, 1, 0.80]}>
                <capsuleGeometry args={[0.034, bootH, 8, 14]} />
                <meshStandardMaterial color={shoeColor} roughness={0.52} metalness={0.04} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
