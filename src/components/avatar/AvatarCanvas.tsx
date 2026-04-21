"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import AvatarModel, { AvatarAppearance } from "./AvatarModel";
import OutfitRenderer from "./OutfitRenderer";
import { Outfit3DParams } from "@/lib/outfit-to-3d";

interface AvatarCanvasProps {
  outfitParams: Outfit3DParams | null;
  autoRotate?: boolean;
  appearance?: AvatarAppearance;
}

export default function AvatarCanvas({ outfitParams, autoRotate = true, appearance }: AvatarCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.0, 3.2], fov: 38 }}
      style={{ background: "#0d0d12" }}
      shadows
    >
      {/* Lighting – three-point studio setup */}
      <ambientLight intensity={0.28} />
      {/* Key light – warm, front-left above */}
      <directionalLight position={[2.5, 4.5, 3.5]} intensity={2.0} castShadow color="#fff5e8" shadow-mapSize={[2048, 2048]} />
      {/* Fill light – cool, opposite side */}
      <directionalLight position={[-3.5, 2.5, 1.5]} intensity={0.7} color="#c0d0ff" />
      {/* Rim light – behind to separate from background */}
      <directionalLight position={[0.5, 3.0, -4.0]} intensity={0.55} color="#e8f0ff" />
      {/* Ground bounce – subtle warm */}
      <hemisphereLight color="#fff8f0" groundColor="#1a1a28" intensity={0.45} />

      {/* Environment for PBR reflections */}
      <Environment preset="studio" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <circleGeometry args={[2.5, 64]} />
        <meshStandardMaterial color="#111118" roughness={0.92} metalness={0.08} />
      </mesh>
      {/* Floor ring glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.115, 0]}>
        <ringGeometry args={[0.72, 0.75, 64]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} />
      </mesh>

      {/* Avatar */}
      <group position={[0, 0, 0]}>
        <AvatarModel appearance={appearance} />
        {outfitParams && <OutfitRenderer params={outfitParams} />}
      </group>

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.85}
        target={[0, 0.8, 0]}
        autoRotate={autoRotate}
        autoRotateSpeed={1}
      />
    </Canvas>
  );
}
