"use client";

import { useMemo } from "react";
import * as THREE from "three";

export interface AvatarAppearance {
  skinTone?: string;
  hairColor?: string;
  hairStyle?: string;
  bodyType?: string;
  height?: string;
  shirtColor?: string;
  pantsColor?: string;
  shoeColor?: string;
}

const SKIN_TONES: Record<string, { base: string; dark: string; lip: string; roughness: number }> = {
  claro:   { base: "#f5d0b0", dark: "#ddb898", lip: "#cc8080", roughness: 0.72 },
  medio:   { base: "#d4a574", dark: "#b88a5a", lip: "#b87060", roughness: 0.70 },
  moreno:  { base: "#a0693a", dark: "#8a5228", lip: "#8a5050", roughness: 0.68 },
  escuro:  { base: "#6b4226", dark: "#4e2e16", lip: "#6a3828", roughness: 0.65 },
  negro:   { base: "#3b2210", dark: "#281500", lip: "#4a2818", roughness: 0.62 },
};

const HAIR_COLORS: Record<string, string> = {
  preto:    "#12100a",
  castanho: "#3d2008",
  loiro:    "#c0980c",
  ruivo:    "#7a2808",
  branco:   "#d8d8d8",
  cinza:    "#707070",
  azul:     "#1030a8",
  rosa:     "#d04098",
  vermelho: "#b00c1a",
  roxo:     "#580898",
  verde:    "#189038",
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
  const skinKey = matchKey(appearance?.skinTone, SKIN_TONES) ?? "medio";
  const skinData = SKIN_TONES[skinKey];

  const hairKey = matchKey(appearance?.hairColor, HAIR_COLORS) ?? "castanho";
  const hairColor = HAIR_COLORS[hairKey];

  const hairStyle = (appearance?.hairStyle || "").toLowerCase();
  const isLongHair  = hairStyle.includes("long") || hairStyle.includes("comprido");
  const isCurly     = hairStyle.includes("cach") || hairStyle.includes("crespo") || hairStyle.includes("afro");
  const isBald      = hairStyle.includes("careca") || hairStyle.includes("raspado");

  const bodyType = (appearance?.bodyType || "").toLowerCase();
  const isSlim     = bodyType.includes("magr") || bodyType.includes("slim") || bodyType.includes("esbelto");
  const isLarge    = bodyType.includes("larg") || bodyType.includes("gord") || bodyType.includes("plus") || bodyType.includes("robusto");
  const isMuscular = bodyType.includes("muscul") || bodyType.includes("atlét") || bodyType.includes("forte");

  const chestScale  = isSlim ? 0.88 : isLarge ? 1.14 : isMuscular ? 1.10 : 1.0;
  const waistScale  = isSlim ? 0.82 : isLarge ? 1.16 : isMuscular ? 0.94 : 1.0;
  const hipScale    = isSlim ? 0.88 : isLarge ? 1.13 : 1.0;
  const armThick    = isSlim ? 0.85 : isLarge ? 1.10 : isMuscular ? 1.18 : 1.0;
  const legThick    = isSlim ? 0.87 : isLarge ? 1.12 : isMuscular ? 1.14 : 1.0;

  const heightStr = (appearance?.height || "").toLowerCase();
  const heightScale = heightStr.includes("baix") || heightStr.includes("petit") ? 0.92
    : heightStr.includes("alt") ? 1.08 : 1.0;

  // Clothing colors
  const shirtColor = appearance?.shirtColor || "#8899bb";
  const pantsColor = appearance?.pantsColor || "#1e2640";
  const shoeColor  = appearance?.shoeColor  || "#e8e8e8";

  const hairMat = useMemo(() => ({ color: hairColor, roughness: 0.85, metalness: 0.0 }), [hairColor]);

  return (
    <group scale={[1, heightScale, 1]}>

      {/* ======= HEAD ======= */}
      <mesh position={[0, 1.76, 0]} scale={[1.0, 1.08, 0.96]}>
        <sphereGeometry args={[0.165, 40, 40]} />
        <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
      </mesh>

      {/* Cheek fill */}
      <mesh position={[-0.10, 1.72, 0.08]} scale={[1, 0.85, 0.7]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
      </mesh>
      <mesh position={[0.10, 1.72, 0.08]} scale={[1, 0.85, 0.7]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
      </mesh>

      {/* Chin */}
      <mesh position={[0, 1.635, 0.06]} scale={[0.9, 0.7, 0.8]}>
        <sphereGeometry args={[0.07, 20, 20]} />
        <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
      </mesh>

      {/* ── HAIR ── */}
      {!isBald && (
        <>
          <mesh position={[0, 1.865, -0.015]} scale={isCurly ? [1.10, 1.0, 1.10] : [1.02, 0.88, 1.02]}>
            <sphereGeometry args={isCurly ? [0.185, 36, 24, 0, Math.PI*2, 0, Math.PI*0.62] : [0.172, 36, 24, 0, Math.PI*2, 0, Math.PI*0.60]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          {/* sides */}
          <mesh position={[-0.08, 1.79, -0.04]}>
            <sphereGeometry args={[isCurly ? 0.13 : 0.115, 20, 16, 0, Math.PI, 0, Math.PI*0.72]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          <mesh position={[0.08, 1.79, -0.04]}>
            <sphereGeometry args={[isCurly ? 0.13 : 0.115, 20, 16, Math.PI, Math.PI, 0, Math.PI*0.72]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          {/* back */}
          <mesh position={[0, isLongHair ? 1.67 : 1.74, -0.09]} scale={isLongHair ? [1, 1.7, 1] : [1, 1, 1]}>
            <sphereGeometry args={[isCurly ? 0.16 : 0.14, 22, 22]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
          {isLongHair && (
            <mesh position={[0, 1.46, -0.11]}>
              <capsuleGeometry args={[0.11, 0.28, 12, 20]} />
              <meshStandardMaterial {...hairMat} />
            </mesh>
          )}
          {isCurly && (
            <>
              <mesh position={[-0.13, 1.84, 0.03]}>
                <sphereGeometry args={[0.075, 14, 14]} />
                <meshStandardMaterial {...hairMat} />
              </mesh>
              <mesh position={[0.13, 1.84, 0.03]}>
                <sphereGeometry args={[0.075, 14, 14]} />
                <meshStandardMaterial {...hairMat} />
              </mesh>
            </>
          )}
        </>
      )}

      {/* ── FACE DETAILS ── */}
      {/* Eye whites */}
      <mesh position={[-0.054, 1.782, 0.142]}>
        <sphereGeometry args={[0.024, 24, 24]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.3} metalness={0} />
      </mesh>
      <mesh position={[0.054, 1.782, 0.142]}>
        <sphereGeometry args={[0.024, 24, 24]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.3} metalness={0} />
      </mesh>
      {/* Irises */}
      <mesh position={[-0.054, 1.782, 0.158]}>
        <sphereGeometry args={[0.015, 18, 18]} />
        <meshStandardMaterial color="#4a6835" roughness={0.4} metalness={0} />
      </mesh>
      <mesh position={[0.054, 1.782, 0.158]}>
        <sphereGeometry args={[0.015, 18, 18]} />
        <meshStandardMaterial color="#4a6835" roughness={0.4} metalness={0} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.054, 1.782, 0.166]}>
        <sphereGeometry args={[0.008, 14, 14]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.1} />
      </mesh>
      <mesh position={[0.054, 1.782, 0.166]}>
        <sphereGeometry args={[0.008, 14, 14]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.1} />
      </mesh>
      {/* Eye shine */}
      <mesh position={[-0.047, 1.788, 0.168]}>
        <sphereGeometry args={[0.003, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.047, 1.788, 0.168]}>
        <sphereGeometry args={[0.003, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Eyebrows */}
      <mesh position={[-0.054, 1.813, 0.133]} rotation={[0.18, 0, 0.07]} scale={[1, 0.55, 0.45]}>
        <capsuleGeometry args={[0.013, 0.014, 6, 12]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0.054, 1.813, 0.133]} rotation={[0.18, 0, -0.07]} scale={[1, 0.55, 0.45]}>
        <capsuleGeometry args={[0.013, 0.014, 6, 12]} />
        <meshStandardMaterial color={hairColor} roughness={0.9} metalness={0} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 1.748, 0.153]} scale={[1, 1.1, 0.9]}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshStandardMaterial color={skinData.dark} roughness={skinData.roughness} metalness={0} />
      </mesh>
      <mesh position={[-0.018, 1.74, 0.155]} scale={[0.8, 0.6, 0.6]}>
        <sphereGeometry args={[0.012, 14, 14]} />
        <meshStandardMaterial color={skinData.dark} roughness={skinData.roughness} metalness={0} />
      </mesh>
      <mesh position={[0.018, 1.74, 0.155]} scale={[0.8, 0.6, 0.6]}>
        <sphereGeometry args={[0.012, 14, 14]} />
        <meshStandardMaterial color={skinData.dark} roughness={skinData.roughness} metalness={0} />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, 1.716, 0.142]} rotation={[0.08, 0, Math.PI/2]} scale={[0.65, 1, 0.55]}>
        <capsuleGeometry args={[0.008, 0.028, 8, 12]} />
        <meshStandardMaterial color={skinData.lip} roughness={0.55} metalness={0} />
      </mesh>

      {/* Ears */}
      <mesh position={[-0.158, 1.775, -0.01]} scale={[0.6, 0.9, 0.55]}>
        <sphereGeometry args={[0.026, 16, 16]} />
        <meshStandardMaterial color={skinData.dark} roughness={skinData.roughness} metalness={0} />
      </mesh>
      <mesh position={[0.158, 1.775, -0.01]} scale={[0.6, 0.9, 0.55]}>
        <sphereGeometry args={[0.026, 16, 16]} />
        <meshStandardMaterial color={skinData.dark} roughness={skinData.roughness} metalness={0} />
      </mesh>

      {/* ======= NECK ======= */}
      <mesh position={[0, 1.575, 0]}>
        <capsuleGeometry args={[0.058, 0.07, 14, 20]} />
        <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
      </mesh>

      {/* ======= BODY (skin base under clothes) ======= */}
      {/* Upper torso */}
      <mesh position={[0, 1.37, 0]} scale={[chestScale, 1, 0.70]}>
        <capsuleGeometry args={[0.185, 0.16, 18, 34]} />
        <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
      </mesh>
      {/* Waist */}
      <mesh position={[0, 1.16, 0]} scale={[waistScale, 1, 0.70]}>
        <capsuleGeometry args={[0.155, 0.08, 14, 28]} />
        <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
      </mesh>
      {/* Hips */}
      <mesh position={[0, 1.00, 0]} scale={[hipScale, 0.82, 0.70]} rotation={[0, 0, Math.PI/2]}>
        <capsuleGeometry args={[0.125, 0.18, 12, 24]} />
        <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
      </mesh>

      {/* ======= SHIRT (over torso + arms) ======= */}
      {/* Shirt body front/back */}
      <mesh position={[0, 1.36, 0]} scale={[chestScale * 1.04, 1.02, 0.76]}>
        <capsuleGeometry args={[0.192, 0.17, 18, 34]} />
        <meshStandardMaterial color={shirtColor} roughness={0.82} metalness={0} />
      </mesh>
      <mesh position={[0, 1.15, 0]} scale={[waistScale * 1.04, 1.02, 0.76]}>
        <capsuleGeometry args={[0.162, 0.09, 14, 28]} />
        <meshStandardMaterial color={shirtColor} roughness={0.82} metalness={0} />
      </mesh>
      {/* Shirt hip cover */}
      <mesh position={[0, 0.98, 0]} scale={[hipScale * 1.04, 0.84, 0.76]} rotation={[0, 0, Math.PI/2]}>
        <capsuleGeometry args={[0.130, 0.19, 12, 24]} />
        <meshStandardMaterial color={shirtColor} roughness={0.82} metalness={0} />
      </mesh>

      {/* ======= ARMS ======= */}
      {/* Left arm */}
      <group position={[-0.235 * chestScale, 1.38, 0]} rotation={[0, 0, 0.05]}>
        {/* Shoulder */}
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.062 * armThick, 20, 20]} />
          <meshStandardMaterial color={shirtColor} roughness={0.82} metalness={0} />
        </mesh>
        {/* Upper arm (shirt sleeve) */}
        <mesh position={[0, -0.14, 0]}>
          <capsuleGeometry args={[0.055 * armThick, 0.17, 12, 20]} />
          <meshStandardMaterial color={shirtColor} roughness={0.82} metalness={0} />
        </mesh>
        {/* Forearm (skin) */}
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.044 * armThick, 0.20, 12, 20]} />
          <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.57, 0.01]} scale={[1, 1.1, 0.72]}>
          <sphereGeometry args={[0.038, 18, 18]} />
          <meshStandardMaterial color={skinData.dark} roughness={skinData.roughness} metalness={0} />
        </mesh>
        {/* Thumb */}
        <mesh position={[0.032, -0.56, 0.02]} rotation={[0, 0, 0.5]} scale={[0.7, 0.6, 0.65]}>
          <capsuleGeometry args={[0.012, 0.024, 6, 10]} />
          <meshStandardMaterial color={skinData.dark} roughness={skinData.roughness} metalness={0} />
        </mesh>
      </group>

      {/* Right arm */}
      <group position={[0.235 * chestScale, 1.38, 0]} rotation={[0, 0, -0.05]}>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.062 * armThick, 20, 20]} />
          <meshStandardMaterial color={shirtColor} roughness={0.82} metalness={0} />
        </mesh>
        <mesh position={[0, -0.14, 0]}>
          <capsuleGeometry args={[0.055 * armThick, 0.17, 12, 20]} />
          <meshStandardMaterial color={shirtColor} roughness={0.82} metalness={0} />
        </mesh>
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.044 * armThick, 0.20, 12, 20]} />
          <meshStandardMaterial color={skinData.base} roughness={skinData.roughness} metalness={0} />
        </mesh>
        <mesh position={[0, -0.57, 0.01]} scale={[1, 1.1, 0.72]}>
          <sphereGeometry args={[0.038, 18, 18]} />
          <meshStandardMaterial color={skinData.dark} roughness={skinData.roughness} metalness={0} />
        </mesh>
        <mesh position={[-0.032, -0.56, 0.02]} rotation={[0, 0, -0.5]} scale={[0.7, 0.6, 0.65]}>
          <capsuleGeometry args={[0.012, 0.024, 6, 10]} />
          <meshStandardMaterial color={skinData.dark} roughness={skinData.roughness} metalness={0} />
        </mesh>
      </group>

      {/* ======= PANTS ======= */}
      {/* Waistband */}
      <mesh position={[0, 0.890, 0]} scale={[hipScale * 1.05, 1, 0.75]}>
        <capsuleGeometry args={[0.145, 0.05, 12, 24]} />
        <meshStandardMaterial color={new THREE.Color(pantsColor).multiplyScalar(0.7)} roughness={0.85} metalness={0} />
      </mesh>

      {/* Left leg */}
      <group position={[-0.095, 0, 0]}>
        {/* Thigh */}
        <mesh position={[0, 0.735, 0]} scale={[legThick, 1, legThick * 0.85]}>
          <capsuleGeometry args={[0.082, 0.18, 12, 22]} />
          <meshStandardMaterial color={pantsColor} roughness={0.88} metalness={0} />
        </mesh>
        {/* Knee */}
        <mesh position={[0, 0.525, 0]} scale={[legThick * 0.9, 1, legThick * 0.8]}>
          <sphereGeometry args={[0.068, 18, 18]} />
          <meshStandardMaterial color={pantsColor} roughness={0.88} metalness={0} />
        </mesh>
        {/* Shin */}
        <mesh position={[0, 0.315, 0]} scale={[legThick * 0.88, 1, legThick * 0.82]}>
          <capsuleGeometry args={[0.060, 0.26, 12, 22]} />
          <meshStandardMaterial color={pantsColor} roughness={0.88} metalness={0} />
        </mesh>
        {/* Ankle */}
        <mesh position={[0, 0.065, 0]}>
          <sphereGeometry args={[0.040, 14, 14]} />
          <meshStandardMaterial color={pantsColor} roughness={0.88} metalness={0} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, 0.028, 0.048]} rotation={[Math.PI/10, 0, 0]} scale={[1.05, 0.72, 1.45]}>
          <capsuleGeometry args={[0.040, 0.095, 12, 16]} />
          <meshStandardMaterial color={shoeColor} roughness={0.60} metalness={0.05} />
        </mesh>
        {/* Shoe sole */}
        <mesh position={[0, -0.008, 0.050]} rotation={[Math.PI/10, 0, 0]} scale={[1.08, 0.28, 1.50]}>
          <capsuleGeometry args={[0.038, 0.095, 8, 12]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.55} metalness={0.02} />
        </mesh>
      </group>

      {/* Right leg */}
      <group position={[0.095, 0, 0]}>
        <mesh position={[0, 0.735, 0]} scale={[legThick, 1, legThick * 0.85]}>
          <capsuleGeometry args={[0.082, 0.18, 12, 22]} />
          <meshStandardMaterial color={pantsColor} roughness={0.88} metalness={0} />
        </mesh>
        <mesh position={[0, 0.525, 0]} scale={[legThick * 0.9, 1, legThick * 0.8]}>
          <sphereGeometry args={[0.068, 18, 18]} />
          <meshStandardMaterial color={pantsColor} roughness={0.88} metalness={0} />
        </mesh>
        <mesh position={[0, 0.315, 0]} scale={[legThick * 0.88, 1, legThick * 0.82]}>
          <capsuleGeometry args={[0.060, 0.26, 12, 22]} />
          <meshStandardMaterial color={pantsColor} roughness={0.88} metalness={0} />
        </mesh>
        <mesh position={[0, 0.065, 0]}>
          <sphereGeometry args={[0.040, 14, 14]} />
          <meshStandardMaterial color={pantsColor} roughness={0.88} metalness={0} />
        </mesh>
        <mesh position={[0, 0.028, 0.048]} rotation={[Math.PI/10, 0, 0]} scale={[1.05, 0.72, 1.45]}>
          <capsuleGeometry args={[0.040, 0.095, 12, 16]} />
          <meshStandardMaterial color={shoeColor} roughness={0.60} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.008, 0.050]} rotation={[Math.PI/10, 0, 0]} scale={[1.08, 0.28, 1.50]}>
          <capsuleGeometry args={[0.038, 0.095, 8, 12]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.55} metalness={0.02} />
        </mesh>
      </group>

    </group>
  );
}
