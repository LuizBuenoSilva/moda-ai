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
      camera={{ position: [0, 1.2, 3.5], fov: 40 }}
      style={{ background: "#0a0a0f" }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} />
      <hemisphereLight
        color="#ffffff"
        groundColor="#444444"
        intensity={0.4}
      />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <circleGeometry args={[2, 64]} />
        <meshStandardMaterial color="#141419" roughness={0.8} />
      </mesh>

      {/* Floor ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0]}>
        <ringGeometry args={[0.8, 0.82, 64]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.3} />
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
