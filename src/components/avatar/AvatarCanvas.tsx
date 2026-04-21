"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Suspense } from "react";
import { AvatarAppearance } from "./AvatarModel";
import GLBAvatar from "./GLBAvatar";
import { Outfit3DParams } from "@/lib/outfit-to-3d";

interface AvatarCanvasProps {
  outfitParams: Outfit3DParams | null;
  autoRotate?: boolean;
  appearance?: AvatarAppearance;
  rpmAvatarUrl?: string | null; // kept for API compatibility, unused
}

export default function AvatarCanvas({ outfitParams, autoRotate = true, appearance }: AvatarCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.90, 3.4], fov: 40 }}
      style={{ background: "#0d0d12" }}
      shadows
    >
      {/* Lighting setup — studio quality */}
      <ambientLight intensity={0.32} />
      <directionalLight
        position={[2.5, 4.5, 3.5]} intensity={2.2} castShadow color="#fff5e8"
        shadow-mapSize={[2048, 2048]} shadow-camera-near={0.1} shadow-camera-far={20}
        shadow-camera-top={3} shadow-camera-bottom={-3} shadow-camera-left={-3} shadow-camera-right={3}
      />
      <directionalLight position={[-3.5, 2.5, 1.5]} intensity={0.80} color="#c0d0ff" />
      <directionalLight position={[0.5, 3.0, -4.0]} intensity={0.65} color="#e8f0ff" />
      <hemisphereLight color="#fff8f0" groundColor="#1a1a28" intensity={0.42} />
      <Environment preset="studio" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} receiveShadow>
        <circleGeometry args={[2.5, 64]} />
        <meshStandardMaterial color="#111118" roughness={0.92} metalness={0.08} />
      </mesh>
      {/* Floor ring glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]}>
        <ringGeometry args={[0.68, 0.71, 64]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} />
      </mesh>
      <ContactShadows position={[0, -0.011, 0]} opacity={0.65} scale={2} blur={1.5} far={1.5} />

      {/* Avatar — GLB model with dynamic outfit colors and hair */}
      <Suspense fallback={null}>
        <GLBAvatar outfitParams={outfitParams} appearance={appearance} />
      </Suspense>

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.06}
        maxPolarAngle={Math.PI * 0.90}
        target={[0, 0.85, 0]}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
}
