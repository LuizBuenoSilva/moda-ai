"use client";

import { TopParams, BottomParams, ShoesParams, AccessoryParams } from "@/lib/outfit-to-3d";

// PBR material props for fabric
function fabricMat(color: string, roughness = 0.88) {
  return { color, roughness, metalness: 0 };
}
function darkColor(hex: string, factor = 0.62): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

export function TopMesh({ params }: { params: TopParams }) {
  const f = params.fit;
  const color = params.material.color;
  const dark = darkColor(color);
  const sleeveLen = params.sleeveLength;
  const hasSleeves = sleeveLen > 0;
  const isRegata = params.type === "regata";

  return (
    <group>
      {/* ── Torso ── */}
      <mesh position={[0, 1.36, 0]} scale={[f * 1.08, 1.02, 0.76 * f]}>
        <capsuleGeometry args={[0.192, 0.165, 16, 32]} />
        <meshStandardMaterial {...fabricMat(color)} />
      </mesh>
      <mesh position={[0, 1.14, 0]} scale={[f * 1.05, 1.02, 0.76 * f]}>
        <capsuleGeometry args={[0.162, 0.095, 14, 28]} />
        <meshStandardMaterial {...fabricMat(color)} />
      </mesh>
      {/* Hem cover over waist */}
      <mesh position={[0, 0.975, 0]} scale={[f * 1.07, 1.0, f * 0.80]}>
        <cylinderGeometry args={[0.192, 0.198, 0.230, 32]} />
        <meshStandardMaterial {...fabricMat(color)} />
      </mesh>
      {/* Hem edge */}
      <mesh position={[0, 0.862, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.196 * f, 0.010, 8, 32]} />
        <meshStandardMaterial {...fabricMat(dark, 0.75)} />
      </mesh>

      {/* ── Shoulders ── */}
      {!isRegata && <>
        <mesh position={[-0.230 * f, 1.400, 0]}>
          <sphereGeometry args={[0.072 * f, 18, 18]} />
          <meshStandardMaterial {...fabricMat(color)} />
        </mesh>
        <mesh position={[0.230 * f, 1.400, 0]}>
          <sphereGeometry args={[0.072 * f, 18, 18]} />
          <meshStandardMaterial {...fabricMat(color)} />
        </mesh>
      </>}

      {/* ── Neckline ── */}
      <mesh position={[0, 1.535, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.068, 0.009, 8, 32]} />
        <meshStandardMaterial {...fabricMat(dark, 0.75)} />
      </mesh>

      {/* ── Sleeves ── */}
      {hasSleeves && <>
        {/* Left */}
        <group position={[-0.240, 1.380, 0]} rotation={[0, 0, 0.06]}>
          <mesh position={[0, -0.100, 0]}>
            <capsuleGeometry args={[0.060 * f, sleeveLen * 0.62, 10, 18]} />
            <meshStandardMaterial {...fabricMat(color)} />
          </mesh>
          {sleeveLen > 0.38 && <mesh position={[0, -0.310, 0]}>
            <capsuleGeometry args={[0.052 * f, sleeveLen * 0.44, 10, 18]} />
            <meshStandardMaterial {...fabricMat(color)} />
          </mesh>}
          {/* Cuff */}
          <mesh position={[0, -0.100 - sleeveLen * 0.33, 0]} rotation={[Math.PI/2, 0, 0.06]}>
            <torusGeometry args={[0.054 * f, 0.007, 8, 20]} />
            <meshStandardMaterial {...fabricMat(dark, 0.72)} />
          </mesh>
        </group>
        {/* Right */}
        <group position={[0.240, 1.380, 0]} rotation={[0, 0, -0.06]}>
          <mesh position={[0, -0.100, 0]}>
            <capsuleGeometry args={[0.060 * f, sleeveLen * 0.62, 10, 18]} />
            <meshStandardMaterial {...fabricMat(color)} />
          </mesh>
          {sleeveLen > 0.38 && <mesh position={[0, -0.310, 0]}>
            <capsuleGeometry args={[0.052 * f, sleeveLen * 0.44, 10, 18]} />
            <meshStandardMaterial {...fabricMat(color)} />
          </mesh>}
          <mesh position={[0, -0.100 - sleeveLen * 0.33, 0]} rotation={[Math.PI/2, 0, -0.06]}>
            <torusGeometry args={[0.054 * f, 0.007, 8, 20]} />
            <meshStandardMaterial {...fabricMat(dark, 0.72)} />
          </mesh>
        </group>
      </>}

      {/* ── Collar (camisa/blazer) ── */}
      {(params.type === "camisa" || params.type === "blazer") && <>
        <mesh position={[-0.038, 1.548, 0.062]} rotation={[0.30, 0.20, 0.10]}>
          <boxGeometry args={[0.038, 0.028, 0.003]} />
          <meshStandardMaterial {...fabricMat(color)} />
        </mesh>
        <mesh position={[0.038, 1.548, 0.062]} rotation={[0.30, -0.20, -0.10]}>
          <boxGeometry args={[0.038, 0.028, 0.003]} />
          <meshStandardMaterial {...fabricMat(color)} />
        </mesh>
        {[1.44, 1.34, 1.24, 1.14, 1.04].map((y, i) => (
          <mesh key={i} position={[0, y, 0.155 * f]}>
            <sphereGeometry args={[0.005, 8, 8]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.1} />
          </mesh>
        ))}
      </>}

      {/* ── Hood (moletom) ── */}
      {params.type === "moletom" && (
        <group position={[0, 1.570, -0.068]}>
          <mesh>
            <sphereGeometry args={[0.125, 18, 18, 0, Math.PI*2, 0, Math.PI/2]} />
            <meshStandardMaterial {...fabricMat(color)} />
          </mesh>
        </group>
      )}

      {/* ── Pocket ── */}
      {params.secondaryColor && (
        <mesh position={[-0.055, 1.340, 0.168 * f]}>
          <boxGeometry args={[0.038, 0.042, 0.003]} />
          <meshStandardMaterial {...fabricMat(params.secondaryColor)} />
        </mesh>
      )}
    </group>
  );
}

export function BottomMesh({ params }: { params: BottomParams }) {
  const f = params.fit;
  const color = params.material.color;
  const dark = darkColor(color);
  const isShorts = params.type === "shorts";

  if (params.isSkirt) {
    return (
      <group>
        <mesh position={[0, 0.680, 0]}>
          <coneGeometry args={[0.290 * f, params.legHeight * 0.55, 32, 1, true]} />
          <meshStandardMaterial {...fabricMat(color)} side={2} />
        </mesh>
        <mesh position={[0, 0.940, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.172 * f, 0.013, 8, 32]} />
          <meshStandardMaterial {...fabricMat(dark, 0.72)} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Waist */}
      <mesh position={[0, 0.945, 0]} scale={[f * 1.04, 1, f * 0.78]}>
        <cylinderGeometry args={[0.188, 0.188, 0.245, 32]} />
        <meshStandardMaterial {...fabricMat(color)} />
      </mesh>
      {/* Hip taper */}
      <mesh position={[0, 0.805, 0]} scale={[f * 1.06, 1, f * 0.78]}>
        <cylinderGeometry args={[0.188, 0.155, 0.162, 32]} />
        <meshStandardMaterial {...fabricMat(color)} />
      </mesh>
      {/* Crotch */}
      <mesh position={[0, 0.745, 0]} scale={[f * 0.94, 1, f * 0.76]}>
        <sphereGeometry args={[0.142, 20, 20]} />
        <meshStandardMaterial {...fabricMat(color)} />
      </mesh>
      {/* Waistband */}
      <mesh position={[0, 1.068, 0]} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.192 * f, 0.014, 10, 32]} />
        <meshStandardMaterial color={dark} roughness={0.80} metalness={0.05} />
      </mesh>

      {/* Legs */}
      {([-0.095, 0.095] as const).map((xPos, i) => (
        <group key={i} position={[xPos, 0, 0]}>
          <mesh position={[0, 0.690, 0]}>
            <capsuleGeometry args={[0.098 * f, 0.125, 10, 20]} />
            <meshStandardMaterial {...fabricMat(color)} />
          </mesh>
          <mesh position={[0, 0.505, 0]}>
            <capsuleGeometry args={[0.090 * f, isShorts ? 0.095 : 0.245, 10, 20]} />
            <meshStandardMaterial {...fabricMat(color)} />
          </mesh>
          {!isShorts && <>
            <mesh position={[0, 0.240, 0]}>
              <capsuleGeometry args={[0.074 * f, 0.305, 10, 20]} />
              <meshStandardMaterial {...fabricMat(color)} />
            </mesh>
            {/* Hem */}
            <mesh position={[0, 0.058, 0]} rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.066 * f, 0.008, 8, 20]} />
              <meshStandardMaterial {...fabricMat(dark, 0.72)} />
            </mesh>
          </>}
          {isShorts && <mesh position={[0, 0.440, 0]} rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.086 * f, 0.008, 8, 20]} />
            <meshStandardMaterial {...fabricMat(dark, 0.72)} />
          </mesh>}
        </group>
      ))}
    </group>
  );
}

export function ShoesMesh({ params }: { params: ShoesParams }) {
  const color = params.material.color;
  const isBoot = params.isBoot;

  return (
    <group>
      {([-0.095, 0.095] as const).map((xPos, i) => (
        <group key={i} position={[xPos, 0, 0]}>
          {/* Upper */}
          <mesh position={[0, 0.024, 0.048]} rotation={[Math.PI/2.2, 0, 0]} scale={[1.02, 0.70, 1.44]}>
            <capsuleGeometry args={[0.040, 0.096, 12, 16]} />
            <meshStandardMaterial color={color} roughness={0.65} metalness={0.02} />
          </mesh>
          {/* Sole */}
          <mesh position={[0, -0.010, 0.048]} rotation={[Math.PI/2.2, 0, 0]} scale={[1.06, 0.26, 1.50]}>
            <capsuleGeometry args={[0.038, 0.094, 8, 12]} />
            <meshStandardMaterial color="#e8e8e8" roughness={0.55} metalness={0.0} />
          </mesh>
          {/* Boot shaft */}
          {isBoot && <>
            <mesh position={[0, 0.118, 0]}>
              <capsuleGeometry args={[0.060, 0.145, 10, 18]} />
              <meshStandardMaterial color={color} roughness={0.65} metalness={0.02} />
            </mesh>
            <mesh position={[0, 0.208, 0]} rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.058, 0.006, 8, 20]} />
              <meshStandardMaterial color={color} roughness={0.65} metalness={0} />
            </mesh>
          </>}
          {/* Lace */}
          {!isBoot && params.type === "tenis" && (
            <mesh position={[0, 0.042, 0.082]}>
              <boxGeometry args={[0.019, 0.022, 0.003]} />
              <meshStandardMaterial color="#f0f0f0" roughness={0.9} metalness={0} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export function AccessoryMesh({ params }: { params: AccessoryParams }) {
  switch (params.type) {
    case "chapeu":
      return <group position={[0, 1.93, 0]}>
        <mesh><cylinderGeometry args={[0.118, 0.138, 0.098, 32]} /><meshStandardMaterial color={params.color} roughness={0.82} metalness={0} /></mesh>
        <mesh position={[0, -0.048, 0]}><cylinderGeometry args={[0.215, 0.215, 0.014, 32]} /><meshStandardMaterial color={params.color} roughness={0.82} metalness={0} /></mesh>
      </group>;
    case "bone":
      return <group position={[0, 1.900, 0]}>
        <mesh><sphereGeometry args={[0.155, 32, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={params.color} roughness={0.82} metalness={0} /></mesh>
        <mesh position={[0, -0.018, 0.108]} rotation={[-0.3, 0, 0]}><boxGeometry args={[0.115, 0.011, 0.076]} /><meshStandardMaterial color={params.color} roughness={0.82} metalness={0} /></mesh>
      </group>;
    case "colar":
      return <mesh position={[0, 1.542, 0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[0.070, 0.006, 16, 32]} /><meshStandardMaterial color={params.color} roughness={0.3} metalness={0.6} /></mesh>;
    case "pulseira":
      return <mesh position={[-0.240, 0.850, 0]} rotation={[Math.PI/2, 0, 0.06]}><torusGeometry args={[0.036, 0.005, 16, 32]} /><meshStandardMaterial color={params.color} roughness={0.3} metalness={0.7} /></mesh>;
    case "relogio":
      return <group position={[0.240, 0.850, 0]}>
        <mesh><boxGeometry args={[0.034, 0.034, 0.014]} /><meshStandardMaterial color={params.color} roughness={0.2} metalness={0.6} /></mesh>
        <mesh rotation={[Math.PI/2, 0, -0.06]}><torusGeometry args={[0.030, 0.005, 8, 32]} /><meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} /></mesh>
      </group>;
    case "bolsa":
      return <group position={[-0.340, 0.700, 0]}>
        <mesh><boxGeometry args={[0.135, 0.175, 0.040]} /><meshStandardMaterial color={params.color} roughness={0.75} metalness={0.05} /></mesh>
        <mesh position={[0, 0.195, 0]} rotation={[0, 0, -0.20]}><boxGeometry args={[0.013, 0.295, 0.007]} /><meshStandardMaterial color={params.color} roughness={0.75} metalness={0.05} /></mesh>
      </group>;
    case "oculos":
      return <group position={[0, 1.788, 0.168]}>
        <mesh position={[-0.053, 0, 0]}><capsuleGeometry args={[0.019, 0.014, 8, 16]} /><meshStandardMaterial color={params.color} roughness={0.1} metalness={0.3} transparent opacity={0.65} /></mesh>
        <mesh position={[0.053, 0, 0]}><capsuleGeometry args={[0.019, 0.014, 8, 16]} /><meshStandardMaterial color={params.color} roughness={0.1} metalness={0.3} transparent opacity={0.65} /></mesh>
        <mesh><boxGeometry args={[0.014, 0.005, 0.004]} /><meshStandardMaterial color="#222" roughness={0.3} metalness={0.6} /></mesh>
      </group>;
    case "brinco":
      return <group>
        <mesh position={[-0.158, 1.758, 0]}><sphereGeometry args={[0.011, 16, 16]} /><meshStandardMaterial color={params.color} roughness={0.2} metalness={0.7} /></mesh>
        <mesh position={[0.158, 1.758, 0]}><sphereGeometry args={[0.011, 16, 16]} /><meshStandardMaterial color={params.color} roughness={0.2} metalness={0.7} /></mesh>
      </group>;
    case "cinto":
      return <mesh position={[0, 0.972, 0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[0.188, 0.012, 8, 32]} /><meshStandardMaterial color={params.color} roughness={0.55} metalness={0.3} /></mesh>;
    case "anel":
      return <mesh position={[0.240, 0.755, 0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[0.011, 0.004, 16, 32]} /><meshStandardMaterial color={params.color} roughness={0.2} metalness={0.8} /></mesh>;
    case "lenco":
      return <mesh position={[0, 1.542, 0.022]}><capsuleGeometry args={[0.038, 0.028, 8, 16]} /><meshStandardMaterial color={params.color} roughness={0.85} metalness={0} /></mesh>;
    case "mochila":
      return <group position={[0, 1.220, -0.168]}>
        <mesh><capsuleGeometry args={[0.098, 0.138, 10, 18]} /><meshStandardMaterial color={params.color} roughness={0.78} metalness={0} /></mesh>
        <mesh position={[-0.058, 0.068, 0.048]}><boxGeometry args={[0.013, 0.255, 0.007]} /><meshStandardMaterial color={params.color} roughness={0.78} metalness={0} /></mesh>
        <mesh position={[0.058, 0.068, 0.048]}><boxGeometry args={[0.013, 0.255, 0.007]} /><meshStandardMaterial color={params.color} roughness={0.78} metalness={0} /></mesh>
      </group>;
    default:
      return null;
  }
}
