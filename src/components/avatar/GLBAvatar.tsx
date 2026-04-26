"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AvatarAppearance } from "./AvatarModel";
import { Outfit3DParams } from "@/lib/outfit-to-3d";

// Ready Player Me avatar — mesh names are standardised
const MODEL_PATH = "/models/rpm-avatar.glb";
useGLTF.preload(MODEL_PATH);

// ── Known RPM mesh roles ───────────────────────────────────────────────────────
const RPM_TOP       = "Wolf3D_Outfit_Top";
const RPM_BOTTOM    = "Wolf3D_Outfit_Bottom";
const RPM_FOOTWEAR  = "Wolf3D_Outfit_Footwear";
const RPM_BODY      = "Wolf3D_Body";
const RPM_HEAD      = "Wolf3D_Head";

const SKIN_TONES: Record<string, string> = {
  claro: "#f5d5b0", medio: "#c8905c", moreno: "#9a6030",
  escuro: "#623818", negro: "#3a1c08",
};

function matchKey<T>(val: string | undefined, map: Record<string, T>): string | null {
  if (!val) return null;
  const l = val.toLowerCase().trim();
  if (map[l] !== undefined) return l;
  for (const k of Object.keys(map)) if (l.includes(k) || k.includes(l)) return k;
  return null;
}

interface Props {
  outfitParams: Outfit3DParams | null;
  appearance?: AvatarAppearance;
}

export default function GLBAvatar({ outfitParams, appearance }: Props) {
  const { scene } = useGLTF(MODEL_PATH);

  // ── Find the named RPM meshes + compute model bounding box ─────────────────
  const { topMesh, bottomMesh, footwearMesh, bodyMesh, headMesh, dims } = useMemo<{
    topMesh: THREE.Mesh | null; bottomMesh: THREE.Mesh | null;
    footwearMesh: THREE.Mesh | null; bodyMesh: THREE.Mesh | null;
    headMesh: THREE.Mesh | null;
    dims: { totalH: number; modelBottom: number; hipY: number };
  }>(() => {
    let topM: THREE.Mesh | null      = null;
    let botM: THREE.Mesh | null      = null;
    let footM: THREE.Mesh | null     = null;
    let bodyM: THREE.Mesh | null     = null;
    let headM: THREE.Mesh | null     = null;
    const fullBox = new THREE.Box3();

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = obj.receiveShadow = true;
      fullBox.union(new THREE.Box3().setFromObject(obj));

      switch (obj.name) {
        case RPM_TOP:      topM  = obj; break;
        case RPM_BOTTOM:   botM  = obj; break;
        case RPM_FOOTWEAR: footM = obj; break;
        case RPM_BODY:     bodyM = obj; break;
        case RPM_HEAD:     headM = obj; break;
      }
    });

    const totalH = fullBox.max.y - fullBox.min.y;
    return {
      topMesh:      topM,
      bottomMesh:   botM,
      footwearMesh: footM,
      bodyMesh:     bodyM,
      headMesh:     headM,
      dims: {
        totalH,
        modelBottom: fullBox.min.y,
        hipY:        fullBox.min.y + totalH * 0.46,
      },
    };
  }, [scene]);

  // ── Colour & material params ───────────────────────────────────────────────
  const topColor    = outfitParams?.top.color    ?? appearance?.shirtColor ?? "#6d28d9";
  const bottomColor = outfitParams?.bottom.color ?? appearance?.pantsColor ?? "#1e1e2e";
  const shoeColor   = outfitParams?.shoes.color  ?? appearance?.shoeColor  ?? "#e8e8e8";

  const topRough    = outfitParams?.top.material.roughness    ?? 0.82;
  const bottomRough = outfitParams?.bottom.material.roughness ?? 0.80;
  const shoeRough   = outfitParams?.shoes.material.roughness  ?? 0.50;

  const isSkirt   = outfitParams?.bottom.isSkirt   ?? false;
  const legHeight = outfitParams?.bottom.legHeight ?? 1.0;

  // ── Apply colours to RPM outfit meshes ────────────────────────────────────
  const createdMats = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    createdMats.current.forEach(m => m.dispose());
    createdMats.current = [];

    const make = (color: string, roughness: number, metalness = 0) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
      createdMats.current.push(m);
      return m;
    };

    if (topMesh)      { topMesh.visible = true;  topMesh.material      = make(topColor,    topRough);  }
    if (footwearMesh) { footwearMesh.visible = true; footwearMesh.material = make(shoeColor, shoeRough, 0.05); }

    if (bottomMesh) {
      if (isSkirt) {
        bottomMesh.visible = false; // hide pants — cone geometry shows instead
      } else {
        bottomMesh.visible = true;
        bottomMesh.material = make(bottomColor, bottomRough);
      }
    }

    return () => {
      if (bottomMesh) bottomMesh.visible = true;
      createdMats.current.forEach(m => m.dispose());
      createdMats.current = [];
    };
  }, [topMesh, bottomMesh, footwearMesh, topColor, bottomColor, shoeColor, topRough, bottomRough, shoeRough, isSkirt]);

  // ── Skin tone ──────────────────────────────────────────────────────────────
  const skinKey = matchKey(appearance?.skinTone, SKIN_TONES);
  useEffect(() => {
    if (!skinKey) return;
    const color = SKIN_TONES[skinKey];
    [bodyMesh, headMesh].forEach(mesh => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat?.color) { mat.color.set(color); mat.needsUpdate = true; }
    });
  }, [bodyMesh, headMesh, skinKey]);

  // ── Skirt geometry dimensions ──────────────────────────────────────────────
  const { totalH: H, hipY } = dims;
  const skirtTopR = H * 0.100;
  const skirtBotR = H * (legHeight > 0.7 ? 0.190 : 0.148);
  const skirtH    = H * legHeight * 0.44;
  const skirtCY   = hipY - skirtH * 0.42;

  return (
    <group>
      <primitive object={scene} />

      {/* ── Skirt cone (only when bottom is saia/saia_longa) ── */}
      {isSkirt && (
        <mesh position={[0, skirtCY, 0]}>
          <cylinderGeometry args={[skirtTopR, skirtBotR, skirtH, 24, 1]} />
          <meshStandardMaterial
            color={bottomColor}
            roughness={bottomRough}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
