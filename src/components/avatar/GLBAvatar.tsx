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
  const { topMeshes, bottomMeshes, modelTop, modelBottom, headR } = useMemo(() => {
    const tops: THREE.Mesh[]    = [];
    const bottoms: THREE.Mesh[] = [];
    const fullBox = new THREE.Box3();

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow    = true;
      obj.receiveShadow = true;

      const box = new THREE.Box3().setFromObject(obj);
      fullBox.union(box);

      const n = obj.name.toLowerCase();
      if (n.includes("tshirt") || n.includes("shirt") || n.includes("sleeve") || n.includes("blouse") || n.includes("top")) {
        tops.push(obj);
      } else if (n.includes("pants") || n.includes("pant") || n.includes("trouser") || n.includes("jean") || n.includes("skirt")) {
        bottoms.push(obj);
      }
    });

    const totalH  = fullBox.max.y - fullBox.min.y;
    // Head radius: ~13% of total height / 2 (1 head ≈ 1/7.5 body)
    const hR      = totalH * 0.067;
    // Crown = top of model; headCentre = crown - hR
    return {
      topMeshes:    tops,
      bottomMeshes: bottoms,
      modelTop:     fullBox.max.y,   // crown of head
      modelBottom:  fullBox.min.y,   // floor level
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

  // ── Hair setup ────────────────────────────────────────────────────────────
  const hairColor = matchKey(appearance?.hairColor, HAIR_COLORS) ?? HAIR_COLORS.castanho;
  const hs     = (appearance?.hairStyle || "").toLowerCase();
  const isBald = hs.includes("careca") || hs.includes("raspado");
  const isLong = hs.includes("long")   || hs.includes("comprido");
  const isCurly= hs.includes("cach")   || hs.includes("crespo") || hs.includes("afro");
  const isBun  = !isBald && !isLong && !isCurly;
  const hm = { color: hairColor, roughness: 0.84, metalness: 0 };

  const hR      = headR;
  const crown   = modelTop;                     // very top of the model (crown of head)
  const headCtr = crown - hR;                  // head centre (ear level)

  /*
   * Key reference points (based on anatomical proportions):
   *   crown     = modelTop            (very top of head)
   *   eyebrow   = crown - hR * 0.58  (below crown ~58% of headR)
   *   chin      = crown - hR * 2.0
   *
   * All hair meshes must stay ABOVE the eyebrow line and BEHIND the face.
   * Face is centred near Z ≈ 0; nose tip is at Z ≈ +hR*0.85.
   * Hair must not go past Z ≈ +hR*0.15 (i.e., well behind the nose).
   */
  const eyebrowY = crown - hR * 0.58;  // minimum Y for hair bottom

  // Scalp cap parameters (shared between styles)
  // Centre sits just below the crown; scale Y limited so bottom stays above eyebrows.
  const capCY  = crown - hR * 0.18;   // cap centre Y  (just inside the crown)
  const capSY  = (capCY - eyebrowY) / hR;  // how much of hR we can extend downward
  const capZ   = -hR * 0.38;          // offset behind head centre

  return (
    <group>
      <primitive object={scene} />

      {/* ════ BUN (coque) ════ */}
      {isBun && (
        <group>
          {/* Scalp dome — skullcap above eyebrows */}
          <mesh position={[0, capCY, capZ]} scale={[0.90, capSY, 0.56]}>
            <sphereGeometry args={[hR, 40, 28]} />
            <meshStandardMaterial {...hm} />
          </mesh>

          {/* Nape coverage — back of the head, below ears */}
          <mesh position={[0, headCtr - hR * 0.05, -hR * 0.92]} scale={[0.64, 0.55, 0.38]}>
            <sphereGeometry args={[hR, 28, 20]} />
            <meshStandardMaterial {...hm} />
          </mesh>

          {/* BUN ball — sits above the crown, towards back */}
          <group position={[0, crown + hR * 0.30, -hR * 0.50]}>
            <mesh scale={[1.0, 0.65, 1.0]}>
              <sphereGeometry args={[hR * 0.38, 30, 22]} />
              <meshStandardMaterial {...hm} />
            </mesh>
            {/* Hair wrap around bun */}
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.46]}>
              <torusGeometry args={[hR * 0.26, hR * 0.085, 10, 28]} />
              <meshStandardMaterial {...hm} />
            </mesh>
            {/* Elastic tie */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[hR * 0.30, hR * 0.022, 8, 28]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.2} />
            </mesh>
          </group>
        </group>
      )}

      {/* ════ LONG ════ */}
      {isLong && (
        <group position={[0, crown, 0]}>
          {/* Scalp dome */}
          <mesh position={[0, -hR * 0.18, capZ]} scale={[0.92, capSY, 0.58]}>
            <sphereGeometry args={[hR, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          {/* Back flow — extends down the back */}
          <mesh position={[0, -hR * 0.72, -hR * 0.55]} scale={[1, 1.85, 1]}>
            <sphereGeometry args={[hR * 0.92, 28, 22]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          {/* Long tail */}
          <mesh position={[0, -hR * 2.20, -hR * 0.68]}>
            <capsuleGeometry args={[hR * 0.58, hR * 2.20, 10, 18]} />
            <meshStandardMaterial {...hm} />
          </mesh>
        </group>
      )}

      {/* ════ CURLY / AFRO ════ */}
      {isCurly && (
        <group position={[0, crown, 0]}>
          {/* Big curly crown */}
          <mesh position={[0, 0, capZ * 0.5]} scale={[1.14, 1.05, 1.10]}>
            <sphereGeometry args={[hR * 1.08, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          {/* Side puffs */}
          {([[-hR, hR * 0.48], [0, hR * 0.80], [hR, hR * 0.48]] as const).map(([x, z], i) => (
            <mesh key={i} position={[x, hR * 0.42, z]}>
              <sphereGeometry args={[hR * 0.44, 14, 12]} />
              <meshStandardMaterial {...hm} />
            </mesh>
          ))}
        </group>
      )}

      {/* ════ SHOES — sneaker / boot silhouette ════ */}
      {([-1, 1] as const).map((side, i) => {
        const footX = side * 0.052;
        const floorY = modelBottom;
        const sc     = outfitParams?.shoes;
        const isBoot = sc?.isBoot ?? false;
        const bootH  = isBoot ? hR * 0.85 : 0;
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
