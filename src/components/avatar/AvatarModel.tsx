"use client";

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
  claro:   { base: "#f0c898", dark: "#d8a878", lip: "#c88080", roughness: 0.75 },
  medio:   { base: "#c8905c", dark: "#aa7040", lip: "#b06858", roughness: 0.72 },
  moreno:  { base: "#9a6030", dark: "#804818", lip: "#8a4848", roughness: 0.70 },
  escuro:  { base: "#623818", dark: "#482200", lip: "#623030", roughness: 0.68 },
  negro:   { base: "#3a1c08", dark: "#280e00", lip: "#482018", roughness: 0.65 },
};

const HAIR_COLORS: Record<string, string> = {
  preto:    "#100c06", castanho: "#3a1a06", loiro: "#b88808",
  ruivo:    "#701806", branco:   "#d0d0d0", cinza: "#686868",
  azul:     "#0828a0", rosa:     "#c83898", vermelho: "#a00818",
  roxo:     "#500890", verde:    "#108030",
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

interface Props { appearance?: AvatarAppearance }

export default function AvatarModel({ appearance }: Props) {
  const skinKey  = matchKey(appearance?.skinTone,  SKIN_TONES) ?? "medio";
  const skin     = SKIN_TONES[skinKey];
  const hairKey  = matchKey(appearance?.hairColor, HAIR_COLORS) ?? "castanho";
  const hairCol  = HAIR_COLORS[hairKey];

  const hairStyle  = (appearance?.hairStyle  || "").toLowerCase();
  const isLong     = hairStyle.includes("long") || hairStyle.includes("comprido");
  const isCurly    = hairStyle.includes("cach") || hairStyle.includes("crespo") || hairStyle.includes("afro");
  const isBald     = hairStyle.includes("careca") || hairStyle.includes("raspado");

  const bodyType   = (appearance?.bodyType   || "").toLowerCase();
  const isSlim     = bodyType.includes("magr") || bodyType.includes("slim");
  const isLarge    = bodyType.includes("larg") || bodyType.includes("gord") || bodyType.includes("plus");
  const isMuscular = bodyType.includes("muscul") || bodyType.includes("atlét") || bodyType.includes("forte");
  const chestScale = isSlim ? 0.88 : isLarge ? 1.14 : isMuscular ? 1.10 : 1.0;
  const armThick   = isSlim ? 0.86 : isLarge ? 1.10 : isMuscular ? 1.18 : 1.0;
  const legThick   = isSlim ? 0.88 : isLarge ? 1.12 : isMuscular ? 1.14 : 1.0;

  const heightStr  = (appearance?.height || "").toLowerCase();
  const hScale     = heightStr.includes("baix") ? 0.93 : heightStr.includes("alt") ? 1.08 : 1.0;

  const S  = { color: skin.base, roughness: skin.roughness, metalness: 0 } as const;
  const SD = { color: skin.dark, roughness: skin.roughness, metalness: 0 } as const;
  const H  = { color: hairCol,   roughness: 0.88,           metalness: 0 } as const;

  return (
    <group scale={[1, hScale, 1]}>

      {/* ── HEAD ── */}
      <mesh position={[0, 1.74, 0]} scale={[1.0, 1.08, 0.96]}>
        <sphereGeometry args={[0.155, 40, 40]} />
        <meshStandardMaterial {...S} />
      </mesh>
      {/* jaw fill */}
      <mesh position={[0, 1.62, 0.04]} scale={[0.88, 0.55, 0.80]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial {...S} />
      </mesh>

      {/* ── HAIR ── */}
      {!isBald && <>
        <mesh position={[0, 1.82, -0.01]} scale={isCurly ? [1.12, 1.0, 1.12] : [1.02, 0.86, 1.02]}>
          <sphereGeometry args={[isCurly ? 0.175 : 0.160, 36, 24, 0, Math.PI*2, 0, Math.PI*0.60]} />
          <meshStandardMaterial {...H} />
        </mesh>
        <mesh position={[-0.075, 1.74, -0.035]}>
          <sphereGeometry args={[isCurly ? 0.118 : 0.106, 18, 14, 0, Math.PI, 0, Math.PI*0.72]} />
          <meshStandardMaterial {...H} />
        </mesh>
        <mesh position={[0.075, 1.74, -0.035]}>
          <sphereGeometry args={[isCurly ? 0.118 : 0.106, 18, 14, Math.PI, Math.PI, 0, Math.PI*0.72]} />
          <meshStandardMaterial {...H} />
        </mesh>
        <mesh position={[0, isLong ? 1.62 : 1.70, -0.085]} scale={isLong ? [1,1.65,1] : [1,1,1]}>
          <sphereGeometry args={[isCurly ? 0.148 : 0.130, 22, 22]} />
          <meshStandardMaterial {...H} />
        </mesh>
        {isLong && <mesh position={[0, 1.42, -0.10]}>
          <capsuleGeometry args={[0.100, 0.30, 12, 20]} />
          <meshStandardMaterial {...H} />
        </mesh>}
        {isCurly && <>
          <mesh position={[-0.12, 1.80, 0.02]}><sphereGeometry args={[0.068, 14, 14]} /><meshStandardMaterial {...H} /></mesh>
          <mesh position={[0.12, 1.80, 0.02]}><sphereGeometry args={[0.068, 14, 14]} /><meshStandardMaterial {...H} /></mesh>
        </>}
      </>}

      {/* ── FACE ── */}
      {/* Eyes */}
      <mesh position={[-0.052, 1.755, 0.136]}><sphereGeometry args={[0.022, 22, 22]} /><meshStandardMaterial color="#f4f4f4" roughness={0.25} metalness={0} /></mesh>
      <mesh position={[0.052, 1.755, 0.136]}><sphereGeometry args={[0.022, 22, 22]} /><meshStandardMaterial color="#f4f4f4" roughness={0.25} metalness={0} /></mesh>
      <mesh position={[-0.052, 1.755, 0.150]}><sphereGeometry args={[0.014, 18, 18]} /><meshStandardMaterial color="#4a6030" roughness={0.4} metalness={0} /></mesh>
      <mesh position={[0.052, 1.755, 0.150]}><sphereGeometry args={[0.014, 18, 18]} /><meshStandardMaterial color="#4a6030" roughness={0.4} metalness={0} /></mesh>
      <mesh position={[-0.052, 1.755, 0.158]}><sphereGeometry args={[0.008, 14, 14]} /><meshStandardMaterial color="#080808" roughness={0.1} metalness={0} /></mesh>
      <mesh position={[0.052, 1.755, 0.158]}><sphereGeometry args={[0.008, 14, 14]} /><meshStandardMaterial color="#080808" roughness={0.1} metalness={0} /></mesh>
      <mesh position={[-0.046, 1.761, 0.160]}><sphereGeometry args={[0.003, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <mesh position={[0.046, 1.761, 0.160]}><sphereGeometry args={[0.003, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
      {/* Eyebrows */}
      <mesh position={[-0.052, 1.790, 0.128]} rotation={[0.18, 0, 0.07]} scale={[1, 0.50, 0.40]}>
        <capsuleGeometry args={[0.012, 0.013, 6, 12]} />
        <meshStandardMaterial color={hairCol} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0.052, 1.790, 0.128]} rotation={[0.18, 0, -0.07]} scale={[1, 0.50, 0.40]}>
        <capsuleGeometry args={[0.012, 0.013, 6, 12]} />
        <meshStandardMaterial color={hairCol} roughness={0.92} metalness={0} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, 1.722, 0.148]} scale={[1, 1.05, 0.85]}><sphereGeometry args={[0.013, 14, 14]} /><meshStandardMaterial {...SD} /></mesh>
      {/* Mouth */}
      <mesh position={[0, 1.696, 0.138]} rotation={[0.08, 0, Math.PI/2]} scale={[0.60, 1, 0.50]}>
        <capsuleGeometry args={[0.007, 0.026, 8, 12]} />
        <meshStandardMaterial color={skin.lip} roughness={0.55} metalness={0} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.152, 1.752, -0.008]} scale={[0.55, 0.85, 0.52]}><sphereGeometry args={[0.024, 16, 16]} /><meshStandardMaterial {...SD} /></mesh>
      <mesh position={[0.152, 1.752, -0.008]} scale={[0.55, 0.85, 0.52]}><sphereGeometry args={[0.024, 16, 16]} /><meshStandardMaterial {...SD} /></mesh>

      {/* ── NECK ── */}
      <mesh position={[0, 1.565, 0]}>
        <capsuleGeometry args={[0.054, 0.075, 12, 20]} />
        <meshStandardMaterial {...S} />
      </mesh>

      {/* ── BODY (skin base – clothing goes on top via OutfitRenderer) ── */}
      {/* chest */}
      <mesh position={[0, 1.360, 0]} scale={[chestScale, 1, 0.68]}>
        <capsuleGeometry args={[0.178, 0.160, 16, 32]} />
        <meshStandardMaterial {...S} />
      </mesh>
      {/* waist */}
      <mesh position={[0, 1.140, 0]} scale={[chestScale * 0.90, 1, 0.68]}>
        <capsuleGeometry args={[0.148, 0.090, 14, 28]} />
        <meshStandardMaterial {...S} />
      </mesh>
      {/* hips */}
      <mesh position={[0, 0.970, 0]} scale={[chestScale * 0.96, 0.78, 0.70]} rotation={[0, 0, Math.PI/2]}>
        <capsuleGeometry args={[0.120, 0.178, 12, 24]} />
        <meshStandardMaterial {...S} />
      </mesh>

      {/* ── ARMS ── */}
      {/* LEFT */}
      <group position={[-0.220 * chestScale, 1.370, 0]} rotation={[0, 0, 0.04]}>
        {/* shoulder ball */}
        <mesh position={[0, 0.018, 0]}><sphereGeometry args={[0.056 * armThick, 18, 18]} /><meshStandardMaterial {...S} /></mesh>
        {/* upper arm */}
        <mesh position={[0, -0.115, 0]}><capsuleGeometry args={[0.048 * armThick, 0.170, 10, 18]} /><meshStandardMaterial {...S} /></mesh>
        {/* elbow */}
        <mesh position={[0, -0.295, 0]}><sphereGeometry args={[0.040 * armThick, 14, 14]} /><meshStandardMaterial {...SD} /></mesh>
        {/* forearm */}
        <mesh position={[0, -0.430, 0]}><capsuleGeometry args={[0.038 * armThick, 0.200, 10, 18]} /><meshStandardMaterial {...S} /></mesh>
        {/* hand */}
        <mesh position={[0, -0.610, 0.008]} scale={[1, 1.08, 0.68]}><sphereGeometry args={[0.034, 16, 16]} /><meshStandardMaterial {...SD} /></mesh>
        <mesh position={[0.028, -0.600, 0.010]} rotation={[0, 0, 0.45]} scale={[0.65, 0.55, 0.60]}><capsuleGeometry args={[0.010, 0.022, 6, 10]} /><meshStandardMaterial {...SD} /></mesh>
      </group>
      {/* RIGHT */}
      <group position={[0.220 * chestScale, 1.370, 0]} rotation={[0, 0, -0.04]}>
        <mesh position={[0, 0.018, 0]}><sphereGeometry args={[0.056 * armThick, 18, 18]} /><meshStandardMaterial {...S} /></mesh>
        <mesh position={[0, -0.115, 0]}><capsuleGeometry args={[0.048 * armThick, 0.170, 10, 18]} /><meshStandardMaterial {...S} /></mesh>
        <mesh position={[0, -0.295, 0]}><sphereGeometry args={[0.040 * armThick, 14, 14]} /><meshStandardMaterial {...SD} /></mesh>
        <mesh position={[0, -0.430, 0]}><capsuleGeometry args={[0.038 * armThick, 0.200, 10, 18]} /><meshStandardMaterial {...S} /></mesh>
        <mesh position={[0, -0.610, 0.008]} scale={[1, 1.08, 0.68]}><sphereGeometry args={[0.034, 16, 16]} /><meshStandardMaterial {...SD} /></mesh>
        <mesh position={[-0.028, -0.600, 0.010]} rotation={[0, 0, -0.45]} scale={[0.65, 0.55, 0.60]}><capsuleGeometry args={[0.010, 0.022, 6, 10]} /><meshStandardMaterial {...SD} /></mesh>
      </group>

      {/* ── LEGS (skin – pants go on top via OutfitRenderer) ── */}
      {/* LEFT */}
      <group position={[-0.092, 0, 0]}>
        <mesh position={[0, 0.820, 0]} scale={[legThick, 1, legThick * 0.84]}><capsuleGeometry args={[0.076, 0.180, 12, 22]} /><meshStandardMaterial {...S} /></mesh>
        <mesh position={[0, 0.595, 0]} scale={[legThick * 0.88, 1, legThick * 0.80]}><sphereGeometry args={[0.064, 18, 18]} /><meshStandardMaterial {...SD} /></mesh>
        <mesh position={[0, 0.380, 0]} scale={[legThick * 0.85, 1, legThick * 0.80]}><capsuleGeometry args={[0.056, 0.280, 12, 22]} /><meshStandardMaterial {...S} /></mesh>
        {/* ankle */}
        <mesh position={[0, 0.078, 0]}><sphereGeometry args={[0.036, 14, 14]} /><meshStandardMaterial {...SD} /></mesh>
        {/* foot */}
        <mesh position={[0, 0.032, 0.050]} rotation={[Math.PI/9, 0, 0]} scale={[1.0, 0.68, 1.40]}>
          <capsuleGeometry args={[0.036, 0.090, 10, 14]} />
          <meshStandardMaterial {...SD} />
        </mesh>
      </group>
      {/* RIGHT */}
      <group position={[0.092, 0, 0]}>
        <mesh position={[0, 0.820, 0]} scale={[legThick, 1, legThick * 0.84]}><capsuleGeometry args={[0.076, 0.180, 12, 22]} /><meshStandardMaterial {...S} /></mesh>
        <mesh position={[0, 0.595, 0]} scale={[legThick * 0.88, 1, legThick * 0.80]}><sphereGeometry args={[0.064, 18, 18]} /><meshStandardMaterial {...SD} /></mesh>
        <mesh position={[0, 0.380, 0]} scale={[legThick * 0.85, 1, legThick * 0.80]}><capsuleGeometry args={[0.056, 0.280, 12, 22]} /><meshStandardMaterial {...S} /></mesh>
        <mesh position={[0, 0.078, 0]}><sphereGeometry args={[0.036, 14, 14]} /><meshStandardMaterial {...SD} /></mesh>
        <mesh position={[0, 0.032, 0.050]} rotation={[Math.PI/9, 0, 0]} scale={[1.0, 0.68, 1.40]}>
          <capsuleGeometry args={[0.036, 0.090, 10, 14]} />
          <meshStandardMaterial {...SD} />
        </mesh>
      </group>

    </group>
  );
}
