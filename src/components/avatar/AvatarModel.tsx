"use client";

import * as THREE from "three";
import { useMemo } from "react";

export default function AvatarModel() {
  const skin = "#d4a574";
  const skinDark = "#c49464";
  const hair = "#2a1810";
  const lip = "#c08070";
  const eyeWhite = "#f0f0f0";
  const pupil = "#3a2a1a";

  // Create a gradient map for toon shading (Sims-like look)
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
    <group>
      {/* ===== HEAD - bigger for Sims proportions ===== */}
      <mesh position={[0, 1.78, 0]} scale={[1, 1.05, 0.95]}>
        <sphereGeometry args={[0.17, 32, 32]} />
        <meshToonMaterial {...toon} />
      </mesh>
      {/* Chin */}
      <mesh position={[0, 1.66, 0.04]}>
        <sphereGeometry args={[0.08, 20, 20]} />
        <meshToonMaterial {...toon} />
      </mesh>

      {/* Hair - full coverage */}
      <mesh position={[0, 1.87, -0.02]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.17, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshToonMaterial color={hair} gradientMap={gradientMap} />
      </mesh>
      {/* Hair sides fuller */}
      <mesh position={[-0.07, 1.80, -0.04]}>
        <sphereGeometry args={[0.12, 20, 16, 0, Math.PI, 0, Math.PI * 0.7]} />
        <meshToonMaterial color={hair} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.07, 1.80, -0.04]}>
        <sphereGeometry args={[0.12, 20, 16, Math.PI, Math.PI, 0, Math.PI * 0.7]} />
        <meshToonMaterial color={hair} gradientMap={gradientMap} />
      </mesh>
      {/* Hair back */}
      <mesh position={[0, 1.75, -0.08]}>
        <sphereGeometry args={[0.15, 20, 20]} />
        <meshToonMaterial color={hair} gradientMap={gradientMap} />
      </mesh>

      {/* FACE */}
      {/* Eyes - bigger, more expressive (Sims-like) */}
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
      {/* Eye highlight */}
      <mesh position={[-0.048, 1.798, 0.17]}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.048, 1.798, 0.17]}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Eyelids/Eyebrows - thicker, more visible */}
      <mesh position={[-0.055, 1.815, 0.135]} rotation={[0.15, 0, 0.06]} scale={[1, 0.6, 0.5]}>
        <capsuleGeometry args={[0.014, 0.015, 6, 12]} />
        <meshToonMaterial color={hair} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.055, 1.815, 0.135]} rotation={[0.15, 0, -0.06]} scale={[1, 0.6, 0.5]}>
        <capsuleGeometry args={[0.014, 0.015, 6, 12]} />
        <meshToonMaterial color={hair} gradientMap={gradientMap} />
      </mesh>

      {/* Nose - small and cute */}
      <mesh position={[0, 1.75, 0.155]}>
        <sphereGeometry args={[0.016, 14, 14]} />
        <meshToonMaterial {...toonDark} />
      </mesh>

      {/* Mouth/Lips - slight smile */}
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

      {/* ===== NECK - smooth transition ===== */}
      <mesh position={[0, 1.58, 0]}>
        <capsuleGeometry args={[0.06, 0.06, 12, 18]} />
        <meshToonMaterial {...toon} />
      </mesh>

      {/* ===== TORSO - smooth, no visible joints ===== */}
      {/* Upper chest - wider */}
      <mesh position={[0, 1.38, 0]} scale={[1, 1, 0.72]}>
        <capsuleGeometry args={[0.19, 0.14, 16, 32]} />
        <meshToonMaterial {...toon} />
      </mesh>
      {/* Mid torso - smooth taper */}
      <mesh position={[0, 1.18, 0]} scale={[1, 1, 0.72]}>
        <capsuleGeometry args={[0.16, 0.06, 14, 28]} />
        <meshToonMaterial {...toon} />
      </mesh>
      {/* Waist connection */}
      <mesh position={[0, 1.06, 0]} scale={[1, 1, 0.72]}>
        <capsuleGeometry args={[0.15, 0.06, 14, 28]} />
        <meshToonMaterial {...toon} />
      </mesh>

      {/* ===== HIPS - smooth, wider ===== */}
      <mesh position={[0, 0.90, 0]} scale={[1, 0.8, 0.72]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.13, 0.15, 12, 24]} />
        <meshToonMaterial {...toon} />
      </mesh>

      {/* ===== ARMS - smooth, no visible joints ===== */}
      {/* Left arm */}
      <group position={[-0.24, 1.40, 0]} rotation={[0, 0, 0.06]}>
        {/* Shoulder smooth */}
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.058, 18, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        {/* Upper arm */}
        <mesh position={[0, -0.13, 0]}>
          <capsuleGeometry args={[0.05, 0.16, 10, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        {/* Forearm - tapers slightly */}
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.042, 0.20, 10, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        {/* Hand - sphere */}
        <mesh position={[0, -0.56, 0]} scale={[1, 1.15, 0.7]}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshToonMaterial {...toon} />
        </mesh>
      </group>

      {/* Right arm */}
      <group position={[0.24, 1.40, 0]} rotation={[0, 0, -0.06]}>
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.058, 18, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, -0.13, 0]}>
          <capsuleGeometry args={[0.05, 0.16, 10, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, -0.38, 0]}>
          <capsuleGeometry args={[0.042, 0.20, 10, 18]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, -0.56, 0]} scale={[1, 1.15, 0.7]}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshToonMaterial {...toon} />
        </mesh>
      </group>

      {/* ===== LEGS - smooth ===== */}
      {/* Left leg */}
      <group position={[-0.10, 0, 0]}>
        {/* Hip joint hidden */}
        <mesh position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.072, 16, 16]} />
          <meshToonMaterial {...toon} />
        </mesh>
        {/* Thigh */}
        <mesh position={[0, 0.58, 0]}>
          <capsuleGeometry args={[0.078, 0.20, 10, 20]} />
          <meshToonMaterial {...toon} />
        </mesh>
        {/* Shin - tapers */}
        <mesh position={[0, 0.26, 0]}>
          <capsuleGeometry args={[0.058, 0.28, 10, 20]} />
          <meshToonMaterial {...toon} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, 0.01, 0.04]} rotation={[Math.PI / 2.5, 0, 0]} scale={[1, 1, 0.8]}>
          <capsuleGeometry args={[0.042, 0.09, 10, 14]} />
          <meshToonMaterial {...toon} />
        </mesh>
      </group>

      {/* Right leg */}
      <group position={[0.10, 0, 0]}>
        <mesh position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.072, 16, 16]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <capsuleGeometry args={[0.078, 0.20, 10, 20]} />
          <meshToonMaterial {...toon} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <capsuleGeometry args={[0.058, 0.28, 10, 20]} />
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
