"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Suspense } from "react";
import AvatarModel, { AvatarAppearance } from "./AvatarModel";
import OutfitRenderer from "./OutfitRenderer";
import RPMAvatar from "./RPMAvatar";
import { Outfit3DParams } from "@/lib/outfit-to-3d";

interface AvatarCanvasProps {
  outfitParams: Outfit3DParams | null;
  autoRotate?: boolean;
  appearance?: AvatarAppearance;
  rpmAvatarUrl?: string | null;
}

function RPMAvatarScene({ url }: { url: string }) {
  return (
    <Suspense fallback={null}>
      <RPMAvatar url={url} />
    </Suspense>
  );
}

export default function AvatarCanvas({ outfitParams, autoRotate = true, appearance, rpmAvatarUrl }: AvatarCanvasProps) {
  const useRPM = !!rpmAvatarUrl;

  return (
    <Canvas
      camera={{ position: [0, 1.1, useRPM ? 2.8 : 3.2], fov: useRPM ? 42 : 38 }}
      style={{ background: "#0d0d12" }}
      shadows
    >
      {/* Lighting */}
      <ambientLight intensity={0.30} />
      <directionalLight position={[2.5, 4.5, 3.5]} intensity={2.2} castShadow color="#fff5e8"
        shadow-mapSize={[2048, 2048]} shadow-camera-near={0.1} shadow-camera-far={20}
        shadow-camera-top={3} shadow-camera-bottom={-3} shadow-camera-left={-3} shadow-camera-right={3}
      />
      <directionalLight position={[-3.5, 2.5, 1.5]} intensity={0.75} color="#c0d0ff" />
      <directionalLight position={[0.5, 3.0, -4.0]} intensity={0.60} color="#e8f0ff" />
      <hemisphereLight color="#fff8f0" groundColor="#1a1a28" intensity={0.40} />

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
      {/* Contact shadow */}
      <ContactShadows position={[0, -0.119, 0]} opacity={0.6} scale={2} blur={1.5} far={1.5} />

      {/* Avatar */}
      {useRPM ? (
        <RPMAvatarScene url={rpmAvatarUrl!} />
      ) : (
        <group position={[0, 0, 0]}>
          <AvatarModel appearance={appearance} />
          {outfitParams && <OutfitRenderer params={outfitParams} />}
        </group>
      )}

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.08}
        maxPolarAngle={Math.PI * 0.88}
        target={[0, useRPM ? 1.0 : 0.8, 0]}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
}
