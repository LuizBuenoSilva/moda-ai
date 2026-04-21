"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

interface Props {
  url: string;
}

export default function RPMAvatar({ url }: Props) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Ensure PBR materials
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      position={[0, 0, 0]}
      scale={[1, 1, 1]}
    />
  );
}
