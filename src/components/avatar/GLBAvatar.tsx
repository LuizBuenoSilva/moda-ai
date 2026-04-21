"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AvatarAppearance } from "./AvatarModel";
import { Outfit3DParams } from "@/lib/outfit-to-3d";

useGLTF.preload("/models/avatar-base.glb");

// ── Skin tone flat colors (applied when user customises) ──────────────────
const SKIN_TONES: Record<string, string> = {
  claro:  "#f0c898",
  medio:  "#c8905c",
  moreno: "#9a6030",
  escuro: "#623818",
  negro:  "#3a1c08",
};

// ── Hair colours ──────────────────────────────────────────────────────────
const HAIR_COLORS: Record<string, string> = {
  preto:    "#100c06", castanho: "#3a1a06", loiro:   "#b88808", ruivo:    "#701806",
  branco:   "#d0d0d0", cinza:    "#686868", azul:    "#0828a0", rosa:     "#c83898",
  vermelho: "#a00818", roxo:     "#500890", verde:   "#108030",
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
  const { scene: rawScene } = useGLTF("/models/avatar-base.glb");

  // Clone so we never mutate the shared cached scene
  const scene = useMemo(() => rawScene.clone(true), [rawScene]);

  const topColor    = outfitParams?.top.color    ?? "#6d28d9";
  const bottomColor = outfitParams?.bottom.color ?? "#1e1e2e";
  const skinKey     = matchKey(appearance?.skinTone, SKIN_TONES);

  // ── Apply dynamic materials every time colours / skin change ─────────────
  useEffect(() => {
    const created: THREE.MeshStandardMaterial[] = [];

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow    = true;
      obj.receiveShadow = true;

      const n = obj.name.toLowerCase();

      /* ── Clothing: replace with outfit colours ── */
      if (n.includes("tshirt") || n.includes("shirt") || n.includes("sleeve") || n.includes("blouse") || n.includes("top")) {
        const m = new THREE.MeshStandardMaterial({ color: topColor, roughness: 0.86, metalness: 0 });
        obj.material = m;
        created.push(m);
        return;
      }
      if (n.includes("pants") || n.includes("pant") || n.includes("trouser") || n.includes("jean")) {
        const m = new THREE.MeshStandardMaterial({ color: bottomColor, roughness: 0.84, metalness: 0 });
        obj.material = m;
        created.push(m);
        return;
      }

      /* ── Body: tint if user set a skin tone ── */
      if (skinKey && n.includes("base_female")) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        if (mat && "color" in mat) {
          mat.color.set(SKIN_TONES[skinKey]);
          mat.needsUpdate = true;
        }
      }
    });

    // Dispose created materials when effect re-runs or unmounts
    return () => created.forEach((m) => m.dispose());
  }, [scene, topColor, bottomColor, skinKey]);

  // ── Hair ─────────────────────────────────────────────────────────────────
  const hairColor = matchKey(appearance?.hairColor, HAIR_COLORS) ?? HAIR_COLORS.castanho;
  const hs        = (appearance?.hairStyle || "").toLowerCase();
  const isBald    = hs.includes("careca") || hs.includes("raspado");
  const isLong    = hs.includes("long")   || hs.includes("comprido");
  const isCurly   = hs.includes("cach")   || hs.includes("crespo") || hs.includes("afro");
  // coque = default when no other style specified
  const isBun     = !isBald && !isLong && !isCurly;

  const hm = { color: hairColor, roughness: 0.85, metalness: 0 };

  // Head centre for THIS model (Y_max≈1.656 → head top; radius≈0.115 → centre≈1.54)
  const headY = 1.535;
  const hR    = 0.108; // head radius

  return (
    <group>
      {/* ── Body + clothes (GLB) ── */}
      <primitive object={scene} />

      {/* ── BUN (coque) ── */}
      {isBun && (
        <group position={[0, headY, 0]}>
          {/* Tight scalp layer */}
          <mesh scale={[1.010, 0.68, 1.010]}>
            <sphereGeometry args={[hR * 1.04, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.64]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          {/* Back of head */}
          <mesh position={[0, -hR * 0.10, -hR * 0.85]}>
            <sphereGeometry args={[hR * 0.88, 36, 24]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          {/* Nape */}
          <mesh position={[0, -hR * 0.80, -hR * 0.68]} scale={[0.85, 0.58, 0.72]}>
            <sphereGeometry args={[hR, 28, 20]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          {/* Temples */}
          {([-1, 1] as const).map((s, i) => (
            <mesh key={i} position={[s * hR * 0.90, -0.010, -0.012]} scale={[0.50, 0.68, 0.52]}>
              <sphereGeometry args={[hR, 20, 16]} />
              <meshStandardMaterial {...hm} />
            </mesh>
          ))}

          {/* ── Bun at crown ── */}
          <group position={[0, hR * 0.60, -hR * 0.26]}>
            {/* Core bun */}
            <mesh scale={[1.0, 0.60, 1.0]}>
              <sphereGeometry args={[0.065, 36, 28]} />
              <meshStandardMaterial {...hm} />
            </mesh>
            {/* Outer torus wrap #1 */}
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.50]}>
              <torusGeometry args={[0.046, 0.019, 14, 36]} />
              <meshStandardMaterial {...hm} />
            </mesh>
            {/* Outer torus wrap #2 */}
            <mesh rotation={[Math.PI / 2, 0.40, 0]} scale={[1.14, 1.14, 0.46]}>
              <torusGeometry args={[0.040, 0.014, 12, 32]} />
              <meshStandardMaterial {...hm} />
            </mesh>
            {/* Hair tie (elastic) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.050, 0.0045, 8, 32]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.15} />
            </mesh>
          </group>

          {/* Wispy strands at temples */}
          {([-1, 1] as const).map((s, i) => (
            <mesh key={i}
              position={[s * hR * 0.80, -hR * 0.30, hR * 0.70]}
              rotation={[0.30, s * 0.16, 0]}
              scale={[0.26, 1, 0.20]}
            >
              <capsuleGeometry args={[0.010, 0.060, 6, 10]} />
              <meshStandardMaterial {...hm} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── LONG hair ── */}
      {isLong && (
        <group position={[0, headY, 0]}>
          <mesh scale={[1.02, 0.90, 1.02]}>
            <sphereGeometry args={[hR * 1.04, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          <mesh position={[0, -hR * 0.68, -hR * 0.55]} scale={[1, 1.80, 1]}>
            <sphereGeometry args={[hR * 0.96, 28, 22]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          <mesh position={[0, headY * -0.14, -hR * 0.70]}>
            <capsuleGeometry args={[0.065, 0.280, 10, 18]} />
            <meshStandardMaterial {...hm} />
          </mesh>
        </group>
      )}

      {/* ── CURLY hair ── */}
      {isCurly && (
        <group position={[0, headY, 0]}>
          <mesh scale={[1.14, 1.04, 1.14]}>
            <sphereGeometry args={[hR * 1.12, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
            <meshStandardMaterial {...hm} />
          </mesh>
          {([[-0.10, 0.02], [0, 0.04], [0.10, 0.02]] as const).map(([x, z], i) => (
            <mesh key={i} position={[x, hR * 0.55, z]}>
              <sphereGeometry args={[0.052, 14, 12]} />
              <meshStandardMaterial {...hm} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
