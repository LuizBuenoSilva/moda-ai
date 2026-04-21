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

const SKIN_TONES: Record<string, { base: string; dark: string; lip: string }> = {
  claro:  { base: "#f0c898", dark: "#d8a870", lip: "#c88080" },
  medio:  { base: "#c8905c", dark: "#aa7040", lip: "#b06858" },
  moreno: { base: "#9a6030", dark: "#7e4818", lip: "#8a4848" },
  escuro: { base: "#623818", dark: "#482200", lip: "#623030" },
  negro:  { base: "#3a1c08", dark: "#280e00", lip: "#482018" },
};

const HAIR_COLORS: Record<string, string> = {
  preto: "#100c06", castanho: "#3a1a06", loiro: "#b88808", ruivo: "#701806",
  branco: "#d0d0d0", cinza: "#686868", azul: "#0828a0", rosa: "#c83898",
  vermelho: "#a00818", roxo: "#500890", verde: "#108030",
};

function matchKey(val: string | undefined, map: Record<string, unknown>): string | null {
  if (!val) return null;
  const l = val.toLowerCase().trim();
  if (map[l]) return l;
  for (const k of Object.keys(map)) if (l.includes(k) || k.includes(l)) return k;
  return null;
}

interface Props { appearance?: AvatarAppearance }

export default function AvatarModel({ appearance }: Props) {
  const skinKey = matchKey(appearance?.skinTone, SKIN_TONES) ?? "medio";
  const skin    = SKIN_TONES[skinKey];
  const hairKey = matchKey(appearance?.hairColor, HAIR_COLORS) ?? "castanho";
  const hairCol = HAIR_COLORS[hairKey];

  const hs  = (appearance?.hairStyle || "").toLowerCase();
  const isLong  = hs.includes("long") || hs.includes("comprido");
  const isCurly = hs.includes("cach") || hs.includes("crespo") || hs.includes("afro");
  const isBald  = hs.includes("careca") || hs.includes("raspado");

  const bt = (appearance?.bodyType || "").toLowerCase();
  const slim = bt.includes("magr") || bt.includes("slim");
  const large = bt.includes("larg") || bt.includes("gord") || bt.includes("plus");
  const musc  = bt.includes("muscul") || bt.includes("atlét") || bt.includes("forte");
  const bw = slim ? 0.86 : large ? 1.15 : musc ? 1.10 : 1.0; // body width
  const lw = slim ? 0.88 : large ? 1.12 : musc ? 1.14 : 1.0; // leg width
  const aw = slim ? 0.87 : large ? 1.10 : musc ? 1.18 : 1.0; // arm width

  const hStr = (appearance?.height || "").toLowerCase();
  const hSc  = hStr.includes("baix") ? 0.93 : hStr.includes("alt") ? 1.08 : 1.0;

  // Material shorthands
  const ms  = (c: string, r = 0.76) => ({ color: c, roughness: r, metalness: 0 } as const);
  const S   = ms(skin.base);
  const SD  = ms(skin.dark, 0.72);
  const LIP = ms(skin.lip,  0.55);
  const H   = ms(hairCol,   0.88);
  const EYE = ms("#f5f5f5", 0.25);
  const IRS = ms("#4a6030", 0.40);
  const PUP = ms("#080808", 0.10);

  return (
    <group scale={[1, hSc, 1]}>

      {/* ══════════ HEAD ══════════ */}
      {/* Main skull */}
      <mesh position={[0, 1.730, 0]} scale={[1.0, 1.10, 0.96]}>
        <sphereGeometry args={[0.152, 48, 48]} />
        <meshStandardMaterial {...S} />
      </mesh>
      {/* Jaw / lower face fill */}
      <mesh position={[0, 1.608, 0.038]} scale={[0.90, 0.58, 0.82]}>
        <sphereGeometry args={[0.130, 32, 32]} />
        <meshStandardMaterial {...S} />
      </mesh>
      {/* Forehead fill */}
      <mesh position={[0, 1.795, 0.020]} scale={[0.95, 0.55, 0.78]}>
        <sphereGeometry args={[0.128, 28, 28]} />
        <meshStandardMaterial {...S} />
      </mesh>
      {/* Cheeks */}
      <mesh position={[-0.095, 1.670, 0.085]} scale={[0.65, 0.70, 0.60]}>
        <sphereGeometry args={[0.068, 20, 20]} /><meshStandardMaterial {...S} />
      </mesh>
      <mesh position={[0.095, 1.670, 0.085]} scale={[0.65, 0.70, 0.60]}>
        <sphereGeometry args={[0.068, 20, 20]} /><meshStandardMaterial {...S} />
      </mesh>

      {/* ── HAIR ── */}
      {!isBald && <>
        {/* Top */}
        <mesh position={[0, 1.820, -0.012]} scale={isCurly ? [1.12, 1.02, 1.12] : [1.03, 0.88, 1.03]}>
          <sphereGeometry args={isCurly ? [0.172, 40, 28, 0, Math.PI*2, 0, Math.PI*0.62] : [0.158, 40, 28, 0, Math.PI*2, 0, Math.PI*0.60]} />
          <meshStandardMaterial {...H} />
        </mesh>
        {/* Sides */}
        <mesh position={[-0.076, 1.740, -0.032]}>
          <sphereGeometry args={[isCurly ? 0.115 : 0.104, 20, 16, 0, Math.PI, 0, Math.PI*0.74]} />
          <meshStandardMaterial {...H} />
        </mesh>
        <mesh position={[0.076, 1.740, -0.032]}>
          <sphereGeometry args={[isCurly ? 0.115 : 0.104, 20, 16, Math.PI, Math.PI, 0, Math.PI*0.74]} />
          <meshStandardMaterial {...H} />
        </mesh>
        {/* Back */}
        <mesh position={[0, isLong ? 1.616 : 1.708, -0.088]} scale={isLong ? [1,1.68,1] : [1,1,1]}>
          <sphereGeometry args={[isCurly ? 0.145 : 0.128, 24, 24]} />
          <meshStandardMaterial {...H} />
        </mesh>
        {isLong && <mesh position={[0, 1.42, -0.105]}>
          <capsuleGeometry args={[0.098, 0.310, 14, 22]} />
          <meshStandardMaterial {...H} />
        </mesh>}
        {isCurly && <>
          <mesh position={[-0.118, 1.800, 0.025]}><sphereGeometry args={[0.064, 14, 14]} /><meshStandardMaterial {...H} /></mesh>
          <mesh position={[0.118, 1.800, 0.025]}><sphereGeometry args={[0.064, 14, 14]} /><meshStandardMaterial {...H} /></mesh>
          <mesh position={[0, 1.810, 0.045]}><sphereGeometry args={[0.055, 14, 14]} /><meshStandardMaterial {...H} /></mesh>
        </>}
      </>}

      {/* ── FACE ── */}
      {/* Eye whites */}
      <mesh position={[-0.050, 1.742, 0.134]}><sphereGeometry args={[0.021, 24, 24]} /><meshStandardMaterial {...EYE} /></mesh>
      <mesh position={[0.050, 1.742, 0.134]}><sphereGeometry args={[0.021, 24, 24]} /><meshStandardMaterial {...EYE} /></mesh>
      {/* Iris */}
      <mesh position={[-0.050, 1.742, 0.148]}><sphereGeometry args={[0.013, 18, 18]} /><meshStandardMaterial {...IRS} /></mesh>
      <mesh position={[0.050, 1.742, 0.148]}><sphereGeometry args={[0.013, 18, 18]} /><meshStandardMaterial {...IRS} /></mesh>
      {/* Pupil */}
      <mesh position={[-0.050, 1.742, 0.155]}><sphereGeometry args={[0.007, 14, 14]} /><meshStandardMaterial {...PUP} /></mesh>
      <mesh position={[0.050, 1.742, 0.155]}><sphereGeometry args={[0.007, 14, 14]} /><meshStandardMaterial {...PUP} /></mesh>
      {/* Eye shine */}
      <mesh position={[-0.044, 1.748, 0.157]}><sphereGeometry args={[0.003, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <mesh position={[0.044, 1.748, 0.157]}><sphereGeometry args={[0.003, 8, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
      {/* Eyebrows */}
      <mesh position={[-0.050, 1.778, 0.127]} rotation={[0.16, 0, 0.07]} scale={[1, 0.48, 0.38]}>
        <capsuleGeometry args={[0.011, 0.014, 6, 12]} /><meshStandardMaterial color={hairCol} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0.050, 1.778, 0.127]} rotation={[0.16, 0, -0.07]} scale={[1, 0.48, 0.38]}>
        <capsuleGeometry args={[0.011, 0.014, 6, 12]} /><meshStandardMaterial color={hairCol} roughness={0.92} metalness={0} />
      </mesh>
      {/* Nose bridge + tip */}
      <mesh position={[0, 1.716, 0.148]} scale={[0.7, 1.4, 0.75]}>
        <sphereGeometry args={[0.012, 14, 14]} /><meshStandardMaterial {...SD} />
      </mesh>
      <mesh position={[-0.016, 1.706, 0.148]} scale={[0.85, 0.65, 0.65]}>
        <sphereGeometry args={[0.010, 12, 12]} /><meshStandardMaterial {...SD} />
      </mesh>
      <mesh position={[0.016, 1.706, 0.148]} scale={[0.85, 0.65, 0.65]}>
        <sphereGeometry args={[0.010, 12, 12]} /><meshStandardMaterial {...SD} />
      </mesh>
      {/* Lips */}
      <mesh position={[0, 1.684, 0.138]} rotation={[0.06, 0, Math.PI/2]} scale={[0.58, 1, 0.50]}>
        <capsuleGeometry args={[0.007, 0.026, 8, 12]} /><meshStandardMaterial {...LIP} />
      </mesh>
      <mesh position={[0, 1.676, 0.136]} rotation={[0.06, 0, Math.PI/2]} scale={[0.48, 1, 0.42]}>
        <capsuleGeometry args={[0.006, 0.020, 8, 12]} /><meshStandardMaterial {...LIP} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.150, 1.735, -0.010]} scale={[0.52, 0.88, 0.50]}>
        <sphereGeometry args={[0.024, 16, 16]} /><meshStandardMaterial {...SD} />
      </mesh>
      <mesh position={[0.150, 1.735, -0.010]} scale={[0.52, 0.88, 0.50]}>
        <sphereGeometry args={[0.024, 16, 16]} /><meshStandardMaterial {...SD} />
      </mesh>

      {/* ══════════ NECK ══════════ */}
      <mesh position={[0, 1.548, 0]}>
        <capsuleGeometry args={[0.050, 0.082, 14, 22]} />
        <meshStandardMaterial {...S} />
      </mesh>
      {/* Neck-to-shoulder fill */}
      <mesh position={[0, 1.488, 0]} scale={[1.40 * bw, 0.55, 0.68]}>
        <sphereGeometry args={[0.095, 24, 24]} />
        <meshStandardMaterial {...S} />
      </mesh>

      {/* ══════════ TORSO (skin base) ══════════ */}
      {/* Upper torso */}
      <mesh position={[0, 1.370, 0]} scale={[bw, 1, 0.66]}>
        <capsuleGeometry args={[0.168, 0.172, 18, 36]} />
        <meshStandardMaterial {...S} />
      </mesh>
      {/* Waist */}
      <mesh position={[0, 1.138, 0]} scale={[bw * 0.88, 1, 0.65]}>
        <capsuleGeometry args={[0.142, 0.095, 16, 32]} />
        <meshStandardMaterial {...S} />
      </mesh>
      {/* Hips */}
      <mesh position={[0, 0.962, 0]} scale={[bw * 0.96, 0.80, 0.68]} rotation={[0, 0, Math.PI/2]}>
        <capsuleGeometry args={[0.112, 0.172, 14, 28]} />
        <meshStandardMaterial {...S} />
      </mesh>

      {/* ══════════ ARMS ══════════
          Key: shoulders start INSIDE torso boundary to avoid gap */}
      {([-1, 1] as const).map((side, i) => {
        const xStart = side * 0.175 * bw; // inside torso
        return (
          <group key={i} position={[xStart, 1.378, 0]}>
            {/* Shoulder sphere — large enough to blend arm into torso */}
            <mesh scale={[aw * 1.05, 1, aw * 0.88]}>
              <sphereGeometry args={[0.082, 22, 22]} />
              <meshStandardMaterial {...S} />
            </mesh>
            {/* Upper arm — offset outward */}
            <mesh position={[side * 0.062, -0.105, 0]}>
              <capsuleGeometry args={[0.046 * aw, 0.182, 12, 22]} />
              <meshStandardMaterial {...S} />
            </mesh>
            {/* Elbow */}
            <mesh position={[side * 0.072, -0.288, 0]}>
              <sphereGeometry args={[0.038 * aw, 16, 16]} />
              <meshStandardMaterial {...SD} />
            </mesh>
            {/* Forearm */}
            <mesh position={[side * 0.078, -0.438, 0]}>
              <capsuleGeometry args={[0.036 * aw, 0.218, 12, 22]} />
              <meshStandardMaterial {...S} />
            </mesh>
            {/* Wrist */}
            <mesh position={[side * 0.082, -0.620, 0]}>
              <sphereGeometry args={[0.028 * aw, 14, 14]} />
              <meshStandardMaterial {...SD} />
            </mesh>
            {/* Hand palm */}
            <mesh position={[side * 0.085, -0.672, 0.008]} scale={[1.0, 1.12, 0.65]}>
              <sphereGeometry args={[0.032, 18, 18]} />
              <meshStandardMaterial {...SD} />
            </mesh>
            {/* Thumb */}
            <mesh position={[side * (0.085 + 0.028), -0.660, 0.012]} rotation={[0, 0, side * 0.42]} scale={[0.60, 0.52, 0.58]}>
              <capsuleGeometry args={[0.010, 0.022, 6, 10]} />
              <meshStandardMaterial {...SD} />
            </mesh>
          </group>
        );
      })}

      {/* ══════════ LEGS ══════════ */}
      {([-0.088, 0.088] as const).map((xPos, i) => (
        <group key={i} position={[xPos, 0, 0]}>
          {/* Hip joint fill */}
          <mesh position={[0, 0.888, 0]} scale={[lw * 1.02, 0.80, lw * 0.82]}>
            <sphereGeometry args={[0.078, 18, 18]} />
            <meshStandardMaterial {...S} />
          </mesh>
          {/* Thigh */}
          <mesh position={[0, 0.718, 0]} scale={[lw, 1, lw * 0.82]}>
            <capsuleGeometry args={[0.072, 0.196, 14, 24]} />
            <meshStandardMaterial {...S} />
          </mesh>
          {/* Knee */}
          <mesh position={[0, 0.490, 0]} scale={[lw * 0.88, 1, lw * 0.80]}>
            <sphereGeometry args={[0.060, 18, 18]} />
            <meshStandardMaterial {...SD} />
          </mesh>
          {/* Calf */}
          <mesh position={[0, 0.302, 0]} scale={[lw * 0.84, 1, lw * 0.80]}>
            <capsuleGeometry args={[0.052, 0.296, 12, 22]} />
            <meshStandardMaterial {...S} />
          </mesh>
          {/* Ankle */}
          <mesh position={[0, 0.068, 0]}>
            <sphereGeometry args={[0.032, 14, 14]} />
            <meshStandardMaterial {...SD} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, 0.026, 0.052]} rotation={[Math.PI/9, 0, 0]} scale={[0.98, 0.65, 1.42]}>
            <capsuleGeometry args={[0.033, 0.092, 10, 14]} />
            <meshStandardMaterial {...SD} />
          </mesh>
        </group>
      ))}

    </group>
  );
}
