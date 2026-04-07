"use client";

import * as THREE from "three";
import { useMemo } from "react";

export interface AvatarAppearance {
  skinTone?: string;
  hairColor?: string;
  hairStyle?: string;
  bodyType?: string;
  height?: string;
}

const SKIN_TONES: Record<string, { base: string; dark: string; lip: string }> = {
  claro: { base: "#f5d0b0", dark: "#e5c0a0", lip: "#d4908a" },
  medio: { base: "#d4a574", dark: "#c49464", lip: "#c08070" },
  moreno: { base: "#b07848", dark: "#a06838", lip: "#a06060" },
  escuro: { base: "#6b4226", dark: "#5a3216", lip: "#7a4a3a" },
  negro: { base: "#3b2210", dark: "#2b1200", lip: "#5a3020" },
};

const HAIR_COLORS: Record<string, string> = {
  preto: "#1a1008",
  castanho: "#4a2a10",
  loiro: "#c8a830",
  ruivo: "#8b3010",
  branco: "#d0d0d0",
  cinza: "#808080",
  azul: "#2040c0",
  rosa: "#e050a0",
  vermelho: "#c01020",
  roxo: "#6020a0",
  verde: "#20a040",
};

function matchKey(value: string | undefined, map: Record<string, unknown>): string | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  if (map[lower]) return lower;
  for (const key of Object.keys(map)) {
    if (lower.includes(key) || key.includes(lower)) return key;
  }
  return null;
}

interface Props {
  appearance?: AvatarAppearance;
}

export default function AvatarModel({ appearance }: Props) {
  const skinKey = matchKey(appearance?.skinTone, SKIN_TONES);
  const skinColors = skinKey ? SKIN_TONES[skinKey] : SKIN_TONES.medio;

  const skin = skinColors.base;
  const skinDark = skinColors.dark;
  const lip = skinColors.lip;

  const hairKey = matchKey(appearance?.hairColor, HAIR_COLORS);
  const hair = hairKey ? HAIR_COLORS[hairKey] : "#2a1810";

  const eyeWhite = "#f0f0f0";
  const pupil = "#3a2a1a";

  // Body proportions based on bodyType
  const bodyType = (appearance?.bodyType || "").toLowerCase();
  const isSlim = bodyType.includes("magr") || bodyType.includes("slim") || bodyType.includes("esbelto");
  const isLarge = bodyType.includes("larg") || bodyType.includes("gord") || bodyType.includes("plus") || bodyType.includes("robusto");
  const isMuscular = bodyType.includes("muscul") || bodyType.includes("atlét") || bodyType.includes("forte");

  const chestScale = isSlim ? 0.88 : isLarge ? 1.15 : isMuscular ? 1.12 : 1;
  const waistScale = isSlim ? 0.85 : isLarge ? 1.18 : isMuscular ? 0.95 : 1;
  const hipScale = isSlim ? 0.88 : isLarge ? 1.15 : 1;
  const armThickness = isSlim ? 0.85 : isLarge ? 1.12 : isMuscular ? 1.2 : 1;
  const legThickness = isSlim ? 0.88 : isLarge ? 1.12 : isMuscular ? 1.15 : 1;

  // Height scale
  const heightStr = (appearance?.height || "").toLowerCase();
  const isShort = heightStr.includes("baix") || heightStr.includes("petit");
  const isTall = heightStr.includes("alt");
  const heightScale = isShort ? 0.92 : isTall ? 1.08 : 1;

  // Hair style
  const hairStyle = (appearance?.hairStyle || "").toLowerCase();
  const isLongHair = hairStyle.includes("long") || hairStyle.includes("comprido");
  const isShortHair = hairStyle.includes("curt") || hairStyle.includes("raspado") || hairStyle.includes("careca");
  const isCurly = hairStyle.includes("cach") || hairStyle.includes("crespo") || hairStyle.includes("afro");
  const isBald = hairStyle.includes("careca") || hairStyle.includes("raspado");

  const gradientMap = useMemo(() => {
    const colors = new Uint8Array([60, 130, 200, 255]);
    const tex = new THREE.DataTexture(colors, 4, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);

  const toon = { color: skin, gradientMap };
  const toonDark = { color: skinDark, gradientMap };

  return (
    <group scale={[1, heightScale, 1]}>
      {/* ===== HEAD ===== */}
      <mesh position={[0, 1.78, 0]} scale={[1, 1.05, 0.95]}>
        <sphereGeometry args={[0.17, 32, 32]} />
        <meshToonMaterial {...toon} />
      </mesh>
      {/* Chin */}
      <mesh position={[0, 1.66, 0.04]}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshToonMaterial {...toon} />
      </mesh>

      {/* Hair - conditional on style */}
      {!isBald && (
        <>
          {/* Hair top */}
          <mesh position={[0, 1.87, -0.02]} scale={isCurly ? [1.08, 0.95, 1.08] : [1, 0.85, 1]}>
            <sphereGeometry args={[isCurly ? 0.19 : 0.17, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <meshToonMaterial color={hair} gradientMap={gradientMap} />
          </mesh>
          {/* Hair sides */}
          <mesh position={[-0.07, 1.80, -0.04]}>
            <sphereGeometry args={[isCurly ? 0.14 : 0.12, 20, 16, 0, Math.PI, 0, Math.PI * 0.7]} />
            <meshToonMaterial color={hair} gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0.07, 1.80, -0.04]}>
            <sphereGeometry args={[isCurly ? 0.14 : 0.12, 20, 16, Math.PI, Math.PI, 0, Math.PI * 0.7]} />
            <meshToonMaterial color={hair} gradientMap={gradientMap} />
          </mesh>
          {/* Hair back */}
          <mesh position={[0, isLongHair ? 1.68 : 1.75, -0.08]} scale={isLongHair ? [1, 1.6, 1] : [1, 1, 1]}>
            <sphereGeometry args={[isCurly ? 0.17 : 0.15, 20, 20]} />
            <meshToonMaterial color={hair} gradientMap={gradientMap} />
          </mesh>
          {/* Long hair extension */}
          {isLongHair && (
            <mesh position={[0, 1.48, -0.10]}>
              <capsuleGeometry args={[0.12, 0.25, 12, 20]} />
              <meshToonMaterial color={hair} gradientMap={gradientMap} />
            </mesh>
          )}
          {/* Curly extra volume */}
          {isCurly && (
            <>
              <mesh position={[-0.12, 1.85, 0.02]}>
                <sphereGeometry args={[0.08, 14, 14]} />
                <meshToonMaterial color={hair} gradientMap={gradientMap} />
              </mesh>
              <mesh position={[0.12, 1.85, 0.02]}>
                <sphereGeometry args={[0.08, 14, 14]} />
                <meshToonMaterial color={hair} gradientMap={gradientMap} />
              </mesh>
            </>
          )}
        </>
      )}

      {/* FACE */}
      {/* Eyes */}
      <mesh position={[-0.055, 1.79, 0.14]}>
        <sphereGeometry args={[0.025, 20, 20]} />
        <meshToonMaterial color={eyeWhite} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.055, 1.79, 0.14]}>
        <sphereGeometry args={[0.025, 20, 20]} />
        <meshToonMaterial color={eyeWhite} gradientMap={gradientMap} />
      </mesh>
      {/* Irises */}
      <mesh position={[-0.055, 1.79, 0.16]}>
        <sphereGeometry args={[0.016, 16, 16]} />
        <meshToonMaterial color="#5c7a3d" gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.055, 1.79, 0.16]}>
        <sphereGeometry args={[0.016, 16, 16]} />
        <meshToonMaterial color="#5c7a3d" gradientMap={gradientMap} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.055, 1.79, 0.168]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshToonMaterial color={pupil} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.055, 1.79, 0.168]}>
        <sphereGeometry args={[0.008, 12, 12]} />
        <meshToonMaterial color={pupil} gradientMap={gradientMap} />
      </mesh>
      {/* Eye highlights */}
      <mesh position={[-0.048, 1.798, 0.17]}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.048, 1.798, 0.17]}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-0.055, 1.815, 0.135]} rotation={[0.15, 0, 0.06]} scale={[1, 0.6, 0.5]}>
        <capsuleGeometry args={[0.014, 0.015, 6, 12]} />
        <meshToonMaterial color={hair} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.055, 1.815, 0.135]} rotation={[0.15, 0, -0.06]} scale={[1, 0.6, 0.5]}>
        <capsuleGeometry args={[0.014, 0.015, 6, 12]} />
        <meshToonMaterial color={hair} gradientMap={gradientMap} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.75, 0.155]}>
        <sphereGeometry args={[0.016, 14, 14]} />
        <meshToonMaterial {...toonDark} />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, 1.72, 0.14]} rotation={[0.1, 0, Math.PI / 2]} scale={[0.7, 1, 0.6]}>
        <capsuleGeometry args={[0.008, 0.03, 8, 12]} />
        <meshToonMaterial color={lip} gradientMap={gradientMap} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.16, 1.78, 0]}>
        <sphereGeometry args={[0.025, 14, 14]} />
        <meshToonMaterial {...toonDark} />
      </mesh>
      <mesh position={[0.16, 1.78, 0]}>
        <sphereGeometry args={[0.025, 14, 14]} />
        <meshToonMaterial {...toonDark} />
      </mesh>

      {/* ===== NECK ===== */}
      <mesh position={[0, 1.58, 0]}>
        <capsuleGeometry args={[0.06, 0.06, 12, 18]} />
        <meshToonMaterial {...toon} />
      </mesh>

      {/* ===== TORSO ===== */}
      <mesh position={[0, 1.38, 0]} scale={[chestScale, 1, 0.72]}>
        <capsuleGeometry args={[0.19, 0.14, 16, 32]} />
        <meshToonMaterial {...toon} />
      </mesh>
      <mesh position={[0, 1.18, 0]} scale={[waistScale, 1, 0.72]}>
        <capsuleGeometry args={[0.16, 0.06, 14, 28]} />
        <meshToonMaterial {...toon} />
      </mesh>
      <mesh position={[0, 1.06, 0]} scale={[waistScale, 1, 0.72]}>
        <capsuleGeometry args={[0.15, 0.06, 14, 28]} />
        <meshToonMaterial {...toon} />
      </mesh>

      {/* ===== HIPS ===== */}
      <mesh position={[0, 0.90, 0]} scale={[hipScale, 0.8, 0.72]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.13, 0.15, 12, 24]} />
        <meshToonMaterial {...toon} />
      </mesh>

      {/* ===== ARMS ===== */}
      <group position={[-0.24 * chestScale, 1.40, 0]} rotation={[0, 0, 0.06]}>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.058 * armThickness, 18, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, -0.13, 0]}>
          <capsuleGeometry args={[0.05 * armThickness, 0.16, 10, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.042 * armThickness, 0.20, 10, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, -0.56, 0]} scale={[1, 1.15, 0.7]}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshToonMaterial {...toon} />
        </mesh>
      </group>

      <group position={[0.24 * chestScale, 1.40, 0]} rotation={[0, 0, -0.06]}>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.058 * armThickness, 18, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, -0.13, 0]}>
          <capsuleGeometry args={[0.05 * armThickness, 0.16, 10, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.042 * armThickness, 0.20, 10, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, -0.56, 0]} scale={[1, 1.15, 0.7]}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshToonMaterial {...toon} />
        </mesh>
      </group>

      {/* ===== LEGS ===== */}
      <group position={[-0.10, 0, 0]}>
        <mesh position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.072 * legThickness, 16, 16]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <capsuleGeometry args={[0.078 * legThickness, 0.20, 10, 20]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <capsuleGeometry args={[0.058 * legThickness, 0.28, 10, 20]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, 0.01, 0.04]} rotation={[Math.PI / 2.5, 0, 0]} scale={[1, 1, 0.8]}>
          <capsuleGeometry args={[0.042, 0.09, 10, 14]} />
          <meshToonMaterial {...toon} />
        </mesh>
      </group>

      <group position={[0.10, 0, 0]}>
        <mesh position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.072 * legThickness, 16, 16]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <capsuleGeometry args={[0.078 * legThickness, 0.20, 10, 20]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <capsuleGeometry args={[0.058 * legThickness, 0.28, 10, 20]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, 0.01, 0.04]} rotation={[Math.PI / 2.5, 0, 0]} scale={[1, 1, 0.8]}>
          <capsuleGeometry args={[0.042, 0.09, 10, 14]} />
          <meshToonMaterial {...toon} />
        </mesh>
      </group>
    </group>
  );
}
