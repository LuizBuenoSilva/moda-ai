"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { TopParams, BottomParams, ShoesParams, AccessoryParams } from "@/lib/outfit-to-3d";

function useGradientMap() {
  return useMemo(() => {
    const colors = new Uint8Array([80, 160, 220, 255]);
    const tex = new THREE.DataTexture(colors, 4, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

// Darker edge for depth
function useDarker(hex: string, factor = 0.6) {
  return useMemo(() => "#" + new THREE.Color(hex).multiplyScalar(factor).getHexString(), [hex, factor]);
}

export function TopMesh({ params }: { params: TopParams }) {
  const f = params.fit;
  const gm = useGradientMap();
  const mat = { color: params.material.color, gradientMap: gm };
  const darkColor = useDarker(params.material.color);
  const hasSleeves = params.sleeveLength > 0;
  const sleeveLen = params.sleeveLength;
  const isRegata = params.type === "regata";

  return (
    <group>
      {/* Main torso clothing */}
      <mesh position={[0, 1.38, 0]} scale={[f * 1.1, 1.03, 0.78 * f]}>
        <capsuleGeometry args={[0.215, 0.16, 14, 30]} />
        <meshToonMaterial {...mat} />
      </mesh>

      {/* Lower torso */}
      <mesh position={[0, 1.18, 0]} scale={[f * 1.08, 1.02, 0.78 * f]}>
        <capsuleGeometry args={[0.185, 0.08, 14, 28]} />
        <meshToonMaterial {...mat} />
      </mesh>
      {/* Waist extension - shirt OVER pants, bigger radius than pants */}
      <mesh position={[0, 1.00, 0]} scale={[Math.max(f, 0.95) * 1.1, 1, Math.max(f, 0.95) * 0.82]}>
        <cylinderGeometry args={[0.195, 0.20, 0.22, 32]} />
        <meshToonMaterial {...mat} />
      </mesh>

      {/* Hem - bottom edge */}
      <mesh position={[0, 0.89, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.20 * Math.max(f, 0.95), 0.013, 8, 32]} />
        <meshToonMaterial color={darkColor} gradientMap={gm} />
      </mesh>

      {/* Shoulder covers */}
      {!isRegata && (
        <>
          <mesh position={[-0.24 * f, 1.42, 0]}>
            <sphereGeometry args={[0.075 * f, 18, 18]} />
            <meshToonMaterial {...mat} />
          </mesh>
          <mesh position={[0.24 * f, 1.42, 0]}>
            <sphereGeometry args={[0.075 * f, 18, 18]} />
            <meshToonMaterial {...mat} />
          </mesh>
        </>
      )}

      {/* Neckline */}
      <mesh position={[0, 1.53, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.072, 0.011, 8, 32]} />
        <meshToonMaterial color={darkColor} gradientMap={gm} />
      </mesh>

      {/* Sleeves */}
      {hasSleeves && (
        <>
          {/* Left sleeve */}
          <group position={[-0.25, 1.40, 0]} rotation={[0, 0, 0.08]}>
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[0.063 * f, sleeveLen * 0.65, 10, 18]} />
              <meshToonMaterial {...mat} />
            </mesh>
            {sleeveLen > 0.4 && (
              <mesh position={[0, -0.33, 0]}>
                <capsuleGeometry args={[0.055 * f, sleeveLen * 0.45, 10, 18]} />
                <meshToonMaterial {...mat} />
              </mesh>
            )}
            {/* Cuff */}
            <mesh position={[0, -0.12 - sleeveLen * 0.35, 0]} rotation={[Math.PI / 2, 0, 0.08]}>
              <torusGeometry args={[0.058 * f, 0.008, 8, 20]} />
              <meshToonMaterial color={darkColor} gradientMap={gm} />
            </mesh>
          </group>
          {/* Right sleeve */}
          <group position={[0.25, 1.40, 0]} rotation={[0, 0, -0.08]}>
            <mesh position={[0, -0.12, 0]}>
              <capsuleGeometry args={[0.063 * f, sleeveLen * 0.65, 10, 18]} />
              <meshToonMaterial {...mat} />
            </mesh>
            {sleeveLen > 0.4 && (
              <mesh position={[0, -0.33, 0]}>
                <capsuleGeometry args={[0.055 * f, sleeveLen * 0.45, 10, 18]} />
                <meshToonMaterial {...mat} />
              </mesh>
            )}
            <mesh position={[0, -0.12 - sleeveLen * 0.35, 0]} rotation={[Math.PI / 2, 0, -0.08]}>
              <torusGeometry args={[0.058 * f, 0.008, 8, 20]} />
              <meshToonMaterial color={darkColor} gradientMap={gm} />
            </mesh>
          </group>
        </>
      )}

      {/* Collar details */}
      {(params.type === "camisa" || params.type === "blazer") && (
        <>
          <mesh position={[-0.04, 1.54, 0.06]} rotation={[0.3, 0.2, 0.1]}>
            <boxGeometry args={[0.04, 0.03, 0.003]} />
            <meshToonMaterial {...mat} />
          </mesh>
          <mesh position={[0.04, 1.54, 0.06]} rotation={[0.3, -0.2, -0.1]}>
            <boxGeometry args={[0.04, 0.03, 0.003]} />
            <meshToonMaterial {...mat} />
          </mesh>
          {/* Buttons */}
          {[1.44, 1.34, 1.24, 1.14, 1.04].map((y, i) => (
            <mesh key={i} position={[0, y, 0.16 * f]}>
              <sphereGeometry args={[0.006, 8, 8]} />
              <meshToonMaterial color="#e0e0e0" gradientMap={gm} />
            </mesh>
          ))}
        </>
      )}

      {/* Hood for moletom */}
      {params.type === "moletom" && (
        <group position={[0, 1.56, -0.07]}>
          <mesh>
            <sphereGeometry args={[0.13, 18, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshToonMaterial {...mat} />
          </mesh>
          <mesh position={[-0.03, -0.02, 0.06]}>
            <cylinderGeometry args={[0.003, 0.003, 0.08, 6]} />
            <meshToonMaterial color="#ddd" gradientMap={gm} />
          </mesh>
          <mesh position={[0.03, -0.02, 0.06]}>
            <cylinderGeometry args={[0.003, 0.003, 0.08, 6]} />
            <meshToonMaterial color="#ddd" gradientMap={gm} />
          </mesh>
        </group>
      )}

      {/* Secondary color detail (pocket) */}
      {params.secondaryColor && (
        <mesh position={[-0.06, 1.34, 0.17 * f]}>
          <boxGeometry args={[0.04, 0.045, 0.003]} />
          <meshToonMaterial color={params.secondaryColor} gradientMap={gm} />
        </mesh>
      )}
    </group>
  );
}

export function BottomMesh({ params }: { params: BottomParams }) {
  const f = params.fit;
  const gm = useGradientMap();
  const mat = { color: params.material.color, gradientMap: gm };
  const darkColor = useDarker(params.material.color);
  const isShorts = params.type === "shorts";

  if (params.isSkirt) {
    return (
      <group>
        <mesh position={[0, 0.68, 0]}>
          <coneGeometry args={[0.28 * f, params.legHeight * 0.55, 32, 1, true]} />
          <meshToonMaterial {...mat} side={2} />
        </mesh>
        <mesh position={[0, 0.93, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.17 * f, 0.014, 8, 32]} />
          <meshToonMaterial color={darkColor} gradientMap={gm} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Waist cylinder - SMALLER radius than shirt so shirt covers it */}
      <mesh position={[0, 0.94, 0]} scale={[Math.max(f, 0.95) * 1.06, 1, Math.max(f, 0.95) * 0.78]}>
        <cylinderGeometry args={[0.185, 0.185, 0.24, 32]} />
        <meshToonMaterial {...mat} />
      </mesh>

      {/* Hip taper */}
      <mesh position={[0, 0.80, 0]} scale={[Math.max(f, 0.95) * 1.08, 1, Math.max(f, 0.95) * 0.78]}>
        <cylinderGeometry args={[0.185, 0.15, 0.16, 32]} />
        <meshToonMaterial {...mat} />
      </mesh>

      {/* Crotch bridge */}
      <mesh position={[0, 0.74, 0]} scale={[Math.max(f, 0.95) * 0.96, 1, Math.max(f, 0.95) * 0.76]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshToonMaterial {...mat} />
      </mesh>

      {/* Belt/waistband - at natural waistline */}
      <mesh position={[0, 1.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.19 * Math.max(f, 0.95), 0.016, 10, 32]} />
        <meshToonMaterial color={darkColor} gradientMap={gm} />
      </mesh>

      {/* Left leg */}
      <group position={[-0.10, 0, 0]}>
        <mesh position={[0, 0.68, 0]}>
          <capsuleGeometry args={[0.10 * f, 0.12, 10, 20]} />
          <meshToonMaterial {...mat} />
        </mesh>
        <mesh position={[0, 0.50, 0]}>
          <capsuleGeometry args={[0.092 * f, isShorts ? 0.10 : 0.24, 10, 20]} />
          <meshToonMaterial {...mat} />
        </mesh>
        {!isShorts && (
          <>
            <mesh position={[0, 0.24, 0]}>
              <capsuleGeometry args={[0.076 * f, 0.30, 10, 20]} />
              <meshToonMaterial {...mat} />
            </mesh>
            <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.067 * f, 0.009, 8, 20]} />
              <meshToonMaterial color={darkColor} gradientMap={gm} />
            </mesh>
          </>
        )}
        {isShorts && (
          <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.088 * f, 0.009, 8, 20]} />
            <meshToonMaterial color={darkColor} gradientMap={gm} />
          </mesh>
        )}
      </group>

      {/* Right leg */}
      <group position={[0.10, 0, 0]}>
        <mesh position={[0, 0.68, 0]}>
          <capsuleGeometry args={[0.10 * f, 0.12, 10, 20]} />
          <meshToonMaterial {...mat} />
        </mesh>
        <mesh position={[0, 0.50, 0]}>
          <capsuleGeometry args={[0.092 * f, isShorts ? 0.10 : 0.24, 10, 20]} />
          <meshToonMaterial {...mat} />
        </mesh>
        {!isShorts && (
          <>
            <mesh position={[0, 0.24, 0]}>
              <capsuleGeometry args={[0.076 * f, 0.30, 10, 20]} />
              <meshToonMaterial {...mat} />
            </mesh>
            <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.067 * f, 0.009, 8, 20]} />
              <meshToonMaterial color={darkColor} gradientMap={gm} />
            </mesh>
          </>
        )}
        {isShorts && (
          <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.088 * f, 0.009, 8, 20]} />
            <meshToonMaterial color={darkColor} gradientMap={gm} />
          </mesh>
        )}
      </group>

      {/* Fly seam */}
      <mesh position={[0, 0.92, 0.17 * f]}>
        <cylinderGeometry args={[0.003, 0.003, 0.18, 6]} />
        <meshToonMaterial color={darkColor} gradientMap={gm} />
      </mesh>
    </group>
  );
}

export function ShoesMesh({ params }: { params: ShoesParams }) {
  const gm = useGradientMap();
  const mat = { color: params.material.color, gradientMap: gm };
  const isBoot = params.isBoot;

  return (
    <group>
      {[-0.10, 0.10].map((xPos, i) => (
        <group key={i} position={[xPos, 0, 0]}>
          {/* Shoe upper */}
          <mesh position={[0, 0.02, 0.04]} rotation={[Math.PI / 2.3, 0, 0]}>
            <capsuleGeometry args={[0.054, isBoot ? 0.06 : 0.10, 10, 16]} />
            <meshToonMaterial {...mat} />
          </mesh>
          {/* Sole */}
          <mesh position={[0, -0.03, 0.04]} rotation={[Math.PI / 2.3, 0, 0]}>
            <capsuleGeometry args={[0.058, 0.09, 10, 14]} />
            <meshToonMaterial color="#1a1a1a" gradientMap={gm} />
          </mesh>
          {/* Boot shaft */}
          {isBoot && (
            <>
              <mesh position={[0, 0.12, 0]}>
                <capsuleGeometry args={[0.063, 0.14, 10, 18]} />
                <meshToonMaterial {...mat} />
              </mesh>
              <mesh position={[0, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.06, 0.007, 8, 20]} />
                <meshToonMaterial color={params.material.color} gradientMap={gm} />
              </mesh>
            </>
          )}
          {/* Lace for tenis */}
          {!isBoot && params.type === "tenis" && (
            <mesh position={[0, 0.04, 0.08]}>
              <boxGeometry args={[0.02, 0.025, 0.003]} />
              <meshToonMaterial color="#ffffff" gradientMap={gm} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export function AccessoryMesh({ params }: { params: AccessoryParams }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const gm = useGradientMap();

  switch (params.type) {
    case "chapeu":
      return (
        <group position={[0, 1.95, 0]}>
          <mesh><cylinderGeometry args={[0.12, 0.14, 0.10, 32]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
          <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.22, 0.22, 0.015, 32]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
        </group>
      );
    case "bone":
      return (
        <group position={[0, 1.92, 0]}>
          <mesh><sphereGeometry args={[0.16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
          <mesh position={[0, -0.02, 0.11]} rotation={[-0.3, 0, 0]}><boxGeometry args={[0.12, 0.012, 0.08]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
        </group>
      );
    case "colar":
      return (<mesh position={[0, 1.54, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.072, 0.007, 16, 32]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>);
    case "pulseira":
      return (<mesh position={[-0.24, 0.85, 0]} rotation={[Math.PI / 2, 0, 0.06]}><torusGeometry args={[0.038, 0.006, 16, 32]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>);
    case "relogio":
      return (
        <group position={[0.24, 0.85, 0]}>
          <mesh><boxGeometry args={[0.035, 0.035, 0.015]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, -0.06]}><torusGeometry args={[0.032, 0.006, 8, 32]} /><meshToonMaterial color="#2a2a2a" gradientMap={gm} /></mesh>
        </group>
      );
    case "bolsa":
      return (
        <group position={[-0.34, 0.7, 0]}>
          <mesh><boxGeometry args={[0.14, 0.18, 0.04]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
          <mesh position={[0, 0.20, 0]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.015, 0.30, 0.008]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
        </group>
      );
    case "oculos":
      return (
        <group position={[0, 1.79, 0.17]}>
          <mesh position={[-0.055, 0, 0]}><capsuleGeometry args={[0.02, 0.015, 8, 16]} /><meshStandardMaterial color={params.color} roughness={0.1} metalness={0.3} transparent opacity={0.7} /></mesh>
          <mesh position={[0.055, 0, 0]}><capsuleGeometry args={[0.02, 0.015, 8, 16]} /><meshStandardMaterial color={params.color} roughness={0.1} metalness={0.3} transparent opacity={0.7} /></mesh>
          <mesh><boxGeometry args={[0.015, 0.005, 0.004]} /><meshStandardMaterial color="#333" roughness={0.3} metalness={0.5} /></mesh>
        </group>
      );
    case "brinco":
      return (
        <group>
          <mesh position={[-0.16, 1.76, 0]}><sphereGeometry args={[0.012, 16, 16]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
          <mesh position={[0.16, 1.76, 0]}><sphereGeometry args={[0.012, 16, 16]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
        </group>
      );
    case "cinto":
      return (<mesh position={[0, 0.97, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.19, 0.013, 8, 32]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>);
    case "anel":
      return (<mesh position={[0.24, 0.75, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.012, 0.004, 16, 32]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>);
    case "lenco":
      return (<mesh position={[0, 1.54, 0.02]}><capsuleGeometry args={[0.04, 0.03, 8, 16]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>);
    case "mochila":
      return (
        <group position={[0, 1.22, -0.17]}>
          <mesh><capsuleGeometry args={[0.10, 0.14, 10, 18]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
          <mesh position={[-0.06, 0.07, 0.05]}><boxGeometry args={[0.015, 0.26, 0.008]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
          <mesh position={[0.06, 0.07, 0.05]}><boxGeometry args={[0.015, 0.26, 0.008]} /><meshToonMaterial color={params.color} gradientMap={gm} /></mesh>
        </group>
      );
    default:
      return null;
  }
}
