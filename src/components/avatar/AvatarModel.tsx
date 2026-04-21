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

const SKIN_TONES: Record<string, { base: string; dark: string; lip: string }> = {
  claro:  { base: "#f0c898", dark: "#d8a870", lip: "#c88080" },
  medio:  { base: "#c8905c", dark: "#aa7040", lip: "#b06858" },
  moreno: { base: "#9a6030", dark: "#7e4818", lip: "#8a4848" },
  escuro: { base: "#623818", dark: "#482200", lip: "#623030" },
  negro:  { base: "#3a1c08", dark: "#280e00", lip: "#482018" },
};

const HAIR_COLORS: Record<string, string> = {
  preto:     "#100c06", castanho: "#3a1a06", loiro:    "#b88808", ruivo: "#701806",
  branco:    "#d0d0d0", cinza:    "#686868", azul:     "#0828a0", rosa:  "#c83898",
  vermelho:  "#a00818", roxo:     "#500890", verde:    "#108030",
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

  const hs      = (appearance?.hairStyle || "").toLowerCase();
  const isLong  = hs.includes("long") || hs.includes("comprido");
  const isCurly = hs.includes("cach") || hs.includes("crespo") || hs.includes("afro");
  const isBald  = hs.includes("careca") || hs.includes("raspado");

  const bt   = (appearance?.bodyType || "").toLowerCase();
  const slim = bt.includes("magr") || bt.includes("slim");
  const large= bt.includes("larg") || bt.includes("gord") || bt.includes("plus");
  const musc = bt.includes("muscul") || bt.includes("atlét") || bt.includes("forte");
  const bw   = slim ? 0.87 : large ? 1.16 : musc ? 1.11 : 1.0;

  const hStr = (appearance?.height || "").toLowerCase();
  const hSc  = hStr.includes("baix") ? 0.93 : hStr.includes("alt") ? 1.08 : 1.0;

  const S   = skin.base;
  const SD  = skin.dark;
  const LIP = skin.lip;
  const H   = hairCol;

  /* ─────────────────────────────────────────────────────────────────────────
     TORSO — LatheGeometry: a single seamless revolution surface.
     Profile points go from neck-bottom → chest → waist → hips.
     The geometry is a single mesh with NO visible seams anywhere.
  ──────────────────────────────────────────────────────────────────────────*/
  const torsoPoints = useMemo(() => {
    // Half-profile: (radius, y).  Lathe revolves around Y axis → seamless surface.
    // bw scales horizontal width; y-coordinates stay fixed.
    const raw: [number, number][] = [
      [0.055,  1.545],  // neck bottom
      [0.088,  1.508],  // collarbone shoulder start
      [0.162,  1.472],  // shoulder peak
      [0.170,  1.418],  // chest upper
      [0.184,  1.352],  // chest full
      [0.172,  1.280],  // chest lower
      [0.138,  1.210],  // waist top
      [0.122,  1.135],  // waist
      [0.134,  1.065],  // waist bottom
      [0.158,  0.992],  // hip start
      [0.200,  0.918],  // hip peak
      [0.196,  0.870],  // hip lower
      [0.168,  0.842],  // crotch/pelvis
    ];
    return raw.map(([r, y]) => new THREE.Vector2(r * bw, y));
  }, [bw]);

  // Leg lathe profile: a single seamless leg (per side)
  const legPoints = useMemo(() => {
    const lw = slim ? 0.88 : large ? 1.10 : musc ? 1.06 : 1.0;
    const raw: [number, number][] = [
      [0.034,  0.175],  // ankle
      [0.044,  0.220],  // lower ankle
      [0.057,  0.360],  // mid calf
      [0.072,  0.460],  // calf peak
      [0.062,  0.542],  // below knee
      [0.064,  0.570],  // knee
      [0.062,  0.600],  // above knee
      [0.086,  0.720],  // lower thigh
      [0.093,  0.800],  // mid thigh
      [0.088,  0.848],  // thigh top
    ];
    return raw.map(([r, y]) => new THREE.Vector2(r * lw, y));
  }, [slim, large, musc]);

  // Arm lathe profile: one seamless arm
  const armPoints = useMemo(() => {
    const aw = slim ? 0.88 : large ? 1.08 : musc ? 1.14 : 1.0;
    // Points relative to shoulder center (y=0 at shoulder, going down)
    const raw: [number, number][] = [
      [0.074,  0.000],  // shoulder
      [0.058, -0.080],  // upper arm top
      [0.055, -0.200],  // upper arm mid
      [0.046, -0.278],  // elbow
      [0.042, -0.310],  // forearm top
      [0.038, -0.420],  // forearm mid
      [0.028, -0.508],  // wrist
      [0.030, -0.540],  // palm base
      [0.000, -0.565],  // palm tip (center)
    ];
    return raw.map(([r, y]) => new THREE.Vector2(r * aw, y));
  }, [slim, large, musc]);

  const mat  = (c: string, r = 0.72) => ({ color: c, roughness: r, metalness: 0 });
  const smat = mat(S);

  // Arm X position: just outside chest peak radius at shoulder height
  const armX = 0.168 * bw + 0.032;

  return (
    <group scale={[1, hSc, 1]}>

      {/* ══════════ HEAD ══════════ */}
      <mesh position={[0, 1.730, 0]} scale={[1.0, 1.10, 0.94]}>
        <sphereGeometry args={[0.150, 52, 40]} />
        <meshStandardMaterial {...smat} />
      </mesh>
      {/* Jaw fill */}
      <mesh position={[0, 1.612, 0.036]} scale={[0.90, 0.56, 0.80]}>
        <sphereGeometry args={[0.128, 32, 24]} />
        <meshStandardMaterial {...smat} />
      </mesh>
      {/* Cheeks */}
      {([-1, 1] as const).map((s, i) => (
        <mesh key={i} position={[s * 0.094, 1.672, 0.086]} scale={[0.66, 0.70, 0.60]}>
          <sphereGeometry args={[0.066, 20, 16]} />
          <meshStandardMaterial {...smat} />
        </mesh>
      ))}

      {/* ── HAIR ── */}
      {!isBald && <>
        <mesh position={[0, 1.820, -0.010]} scale={isCurly ? [1.13, 1.04, 1.13] : [1.04, 0.88, 1.04]}>
          <sphereGeometry args={isCurly ? [0.172, 40, 24, 0, Math.PI*2, 0, Math.PI*0.62] : [0.158, 40, 24, 0, Math.PI*2, 0, Math.PI*0.60]} />
          <meshStandardMaterial {...mat(H, 0.88)} />
        </mesh>
        {([-1, 1] as const).map((s, i) => (
          <mesh key={i} position={[s * 0.074, 1.742, -0.030]}>
            <sphereGeometry args={[isCurly ? 0.114 : 0.103, 20, 16, s < 0 ? 0 : Math.PI, Math.PI, 0, Math.PI * 0.74]} />
            <meshStandardMaterial {...mat(H, 0.88)} />
          </mesh>
        ))}
        <mesh position={[0, isLong ? 1.618 : 1.710, -0.090]} scale={isLong ? [1, 1.70, 1] : [1, 1, 1]}>
          <sphereGeometry args={[isCurly ? 0.144 : 0.128, 24, 20]} />
          <meshStandardMaterial {...mat(H, 0.88)} />
        </mesh>
        {isLong && (
          <mesh position={[0, 1.424, -0.108]}>
            <capsuleGeometry args={[0.098, 0.312, 14, 22]} />
            <meshStandardMaterial {...mat(H, 0.88)} />
          </mesh>
        )}
        {isCurly && ([[-0.120, 0.020], [0, 0.045], [0.120, 0.020]] as const).map(([x, z], i) => (
          <mesh key={i} position={[x, 1.802, z]}>
            <sphereGeometry args={[0.060, 14, 12]} />
            <meshStandardMaterial {...mat(H, 0.88)} />
          </mesh>
        ))}
      </>}

      {/* ── FACE ── */}
      {([-0.050, 0.050] as const).map((x, i) => (
        <group key={i}>
          <mesh position={[x, 1.744, 0.134]}><sphereGeometry args={[0.021, 24, 20]} /><meshStandardMaterial color="#f5f5f5" roughness={0.25} metalness={0} /></mesh>
          <mesh position={[x, 1.744, 0.148]}><sphereGeometry args={[0.013, 18, 16]} /><meshStandardMaterial color="#4a6030" roughness={0.38} metalness={0} /></mesh>
          <mesh position={[x, 1.744, 0.155]}><sphereGeometry args={[0.007, 14, 12]} /><meshStandardMaterial color="#080808" roughness={0.1} metalness={0} /></mesh>
          <mesh position={[x + (x < 0 ? 0.006 : -0.006), 1.750, 0.156]}><sphereGeometry args={[0.003, 8, 8]} /><meshStandardMaterial color="#ffffff" roughness={0} metalness={0} /></mesh>
          <mesh position={[x, 1.780, 0.128]} rotation={[0.16, 0, x < 0 ? 0.07 : -0.07]} scale={[1, 0.48, 0.38]}>
            <capsuleGeometry args={[0.011, 0.014, 6, 12]} /><meshStandardMaterial color={H} roughness={0.92} metalness={0} />
          </mesh>
        </group>
      ))}
      {/* Nose */}
      <mesh position={[0, 1.716, 0.148]} scale={[0.70, 1.42, 0.74]}><sphereGeometry args={[0.012, 14, 12]} /><meshStandardMaterial {...mat(SD)} /></mesh>
      {([-0.016, 0.016] as const).map((x, i) => (
        <mesh key={i} position={[x, 1.706, 0.148]} scale={[0.86, 0.64, 0.64]}><sphereGeometry args={[0.010, 12, 10]} /><meshStandardMaterial {...mat(SD)} /></mesh>
      ))}
      {/* Lips */}
      <mesh position={[0, 1.684, 0.138]} rotation={[0.06, 0, Math.PI/2]} scale={[0.58, 1, 0.50]}>
        <capsuleGeometry args={[0.007, 0.026, 8, 12]} /><meshStandardMaterial {...mat(LIP, 0.52)} />
      </mesh>
      <mesh position={[0, 1.676, 0.136]} rotation={[0.06, 0, Math.PI/2]} scale={[0.48, 1, 0.42]}>
        <capsuleGeometry args={[0.006, 0.020, 8, 12]} /><meshStandardMaterial {...mat(LIP, 0.52)} />
      </mesh>
      {/* Ears */}
      {([-1, 1] as const).map((s, i) => (
        <mesh key={i} position={[s * 0.150, 1.736, -0.010]} scale={[0.52, 0.88, 0.50]}>
          <sphereGeometry args={[0.024, 16, 14]} /><meshStandardMaterial {...mat(SD)} />
        </mesh>
      ))}

      {/* ══════════ NECK ══════════ */}
      {/* Single tapered cylinder — perfectly smooth, no visible joints */}
      <mesh position={[0, 1.527, 0]} scale={[1, 1, 0.88]}>
        <cylinderGeometry args={[0.048, 0.064, 0.095, 32]} />
        <meshStandardMaterial {...smat} />
      </mesh>
      {/* Top cap blends into head */}
      <mesh position={[0, 1.574, 0]} scale={[1, 0.50, 0.88]}>
        <sphereGeometry args={[0.048, 28, 20]} />
        <meshStandardMaterial {...smat} />
      </mesh>

      {/* ══════════ TORSO — single seamless LatheGeometry ══════════ */}
      {/* Z scale = 0.66 makes the body flat front-to-back (realistic) */}
      <mesh scale={[1, 1, 0.66]}>
        <latheGeometry args={[torsoPoints, 48]} />
        <meshStandardMaterial {...smat} side={2} />
      </mesh>

      {/* ══════════ ARMS — seamless LatheGeometry per arm ══════════ */}
      {([-1, 1] as const).map((side, ai) => (
        <group key={ai} position={[side * armX, 1.490, 0]} scale={[1, 1, 0.92]}>
          <mesh>
            <latheGeometry args={[armPoints, 28]} />
            <meshStandardMaterial {...smat} side={2} />
          </mesh>
        </group>
      ))}

      {/* ══════════ LEGS — seamless LatheGeometry per leg ══════════ */}
      {([-1, 1] as const).map((side, li) => (
        <group key={li} position={[side * 0.096 * bw, 0, 0]} scale={[1, 1, 0.86]}>
          <mesh>
            <latheGeometry args={[legPoints, 28]} />
            <meshStandardMaterial {...smat} side={2} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, 0.148, 0.055]} rotation={[Math.PI / 8.5, 0, 0]} scale={[0.98, 0.58, 1.50]}>
            <capsuleGeometry args={[0.034, 0.096, 10, 16]} />
            <meshStandardMaterial {...mat(SD)} />
          </mesh>
        </group>
      ))}

    </group>
  );
}
