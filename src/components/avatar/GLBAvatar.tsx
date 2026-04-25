"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AvatarAppearance } from "./AvatarModel";
import { Outfit3DParams } from "@/lib/outfit-to-3d";

useGLTF.preload("/models/avatar-base.glb");

const SKIN_TONES: Record<string, string> = {
  claro: "#f0c898", medio: "#c8905c", moreno: "#9a6030",
  escuro: "#623818", negro: "#3a1c08",
};

function matchKey<T>(val: string | undefined, map: Record<string, T>): T | null {
  if (!val) return null;
  const l = val.toLowerCase().trim();
  if (map[l] !== undefined) return map[l];
  for (const k of Object.keys(map)) if (l.includes(k) || k.includes(l)) return map[k];
  return null;
}

/** Returns true if the mesh has valid, non-degenerate geometry */
function isValidMesh(obj: THREE.Mesh): boolean {
  const vCount = obj.geometry.attributes.position?.count ?? 0;
  if (vCount < 3) return false; // points / lines → skip
  const b = new THREE.Box3().setFromObject(obj);
  const diag = b.max.distanceTo(b.min);
  return diag >= 0.004; // filter the mystery "dot" (near-zero volume)
}

interface Props {
  outfitParams: Outfit3DParams | null;
  appearance?: AvatarAppearance;
}

export default function GLBAvatar({ outfitParams, appearance }: Props) {
  const { scene } = useGLTF("/models/avatar-base.glb");

  // ── Classify meshes + measure model ────────────────────────────────────────
  const { topMeshes, bottomMeshes, dims } = useMemo(() => {
    const tops: THREE.Mesh[]    = [];
    const bottoms: THREE.Mesh[] = [];
    const fullBox = new THREE.Box3();

    // Pass 1 – build bounding box of valid meshes only
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || !isValidMesh(obj)) return;
      fullBox.union(new THREE.Box3().setFromObject(obj));
    });

    const totalH = fullBox.max.y - fullBox.min.y;
    const totalD = fullBox.max.z - fullBox.min.z;
    const midY       = fullBox.min.y + totalH * 0.47; // waist split
    const headStartY = fullBox.max.y - totalH * 0.17; // ignore head zone

    // Foot detection: look for non-skin meshes below 14% height
    const footThresh = fullBox.min.y + totalH * 0.14;
    let footXL = -totalH * 0.057; // defaults if no foot mesh found
    let footXR =  totalH * 0.057;
    let footZ  =  totalD * 0.09; // feet slightly forward

    // Pass 2 – classify
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || !isValidMesh(obj)) return;
      obj.castShadow = obj.receiveShadow = true;

      const n = obj.name.toLowerCase();
      // Skip skin / facial features
      if (n.includes("base") || n.includes("eye") || n.includes("teeth") ||
          n.includes("tongue") || n.includes("hair") || n.includes("lash")) return;

      const b = new THREE.Box3().setFromObject(obj);
      const cy = (b.max.y + b.min.y) / 2;
      if (cy > headStartY) return; // above neck → skip

      // Try to detect actual foot X/Z from low meshes
      if (b.min.y < footThresh) {
        const cx = (b.max.x + b.min.x) / 2;
        const cz = (b.max.z + b.min.z) / 2;
        if (cx < -0.01) { footXL = cx; footZ = cz; }
        else if (cx >  0.01) { footXR = cx; footZ = cz; }
      }

      if (cy >= midY) tops.push(obj);
      else            bottoms.push(obj);
    });

    return {
      topMeshes:    tops,
      bottomMeshes: bottoms,
      dims: {
        totalH,
        modelBottom: fullBox.min.y,
        // Key Y landmarks (fraction of totalH from bottom)
        ankleY:    fullBox.min.y + totalH * 0.09,
        hipY:      fullBox.min.y + totalH * 0.45,
        waistY:    fullBox.min.y + totalH * 0.50,
        shoulderY: fullBox.min.y + totalH * 0.76,
        footXL, footXR, footZ,
      },
    };
  }, [scene]);

  // ── Clothing colours & material props ───────────────────────────────────────
  const topColor    = outfitParams?.top.color    ?? appearance?.shirtColor ?? "#6d28d9";
  const bottomColor = outfitParams?.bottom.color ?? appearance?.pantsColor ?? "#1e1e2e";
  const shoeColor   = outfitParams?.shoes.color  ?? appearance?.shoeColor  ?? "#e8e8e8";

  const topRough    = outfitParams?.top.material.roughness    ?? 0.86;
  const bottomRough = outfitParams?.bottom.material.roughness ?? 0.84;

  const isSkirt   = outfitParams?.bottom.isSkirt    ?? false;
  const legHeight = outfitParams?.bottom.legHeight  ?? 1.0;
  const isBoot    = outfitParams?.shoes.isBoot      ?? false;

  // ── Apply colours to GLB meshes ─────────────────────────────────────────────
  const createdMats = useRef<THREE.MeshStandardMaterial[]>([]);

  useEffect(() => {
    createdMats.current.forEach(m => m.dispose());
    createdMats.current = [];

    const make = (color: string, roughness: number) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
      createdMats.current.push(m);
      return m;
    };

    topMeshes.forEach(mesh => {
      mesh.visible  = true;
      mesh.material = make(topColor, topRough);
    });

    bottomMeshes.forEach(mesh => {
      if (isSkirt) {
        // Hide the pants geometry so the skin mesh underneath shows the legs
        mesh.visible = false;
      } else {
        mesh.visible  = true;
        mesh.material = make(bottomColor, bottomRough);
      }
    });

    return () => {
      // Restore visibility on cleanup
      bottomMeshes.forEach(m => { m.visible = true; });
      createdMats.current.forEach(m => m.dispose());
      createdMats.current = [];
    };
  }, [topMeshes, bottomMeshes, topColor, bottomColor, topRough, bottomRough, isSkirt]);

  // ── Skin tone ───────────────────────────────────────────────────────────────
  const skinKey = matchKey(appearance?.skinTone, SKIN_TONES);
  useEffect(() => {
    if (!skinKey) return;
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      if (!obj.name.toLowerCase().includes("base")) return;
      const mat = obj.material as THREE.MeshStandardMaterial;
      if (mat?.color) { mat.color.set(SKIN_TONES[skinKey]); mat.needsUpdate = true; }
    });
  }, [scene, skinKey]);

  // ── Computed 3-D dimensions ─────────────────────────────────────────────────
  const { totalH: H, modelBottom, hipY, footXL, footXR, footZ } = dims;

  // — Skirt
  const skirtTopR = H * 0.108;                                    // waist radius
  const skirtBotR = H * (legHeight > 0.7 ? 0.200 : 0.155);       // hem (wider for long)
  const skirtH    = H * legHeight * 0.46;
  const skirtCY   = hipY - skirtH * 0.43;                        // centre Y of cylinder

  // — Shoes: capsule base radius + scale → smooth rounded shape
  const capR    = H * 0.018;   // base capsule radius
  const capLen  = H * 0.038;   // base capsule length (Y axis before scale)
  const shoeW   = H * 0.052;   // final half-width
  const shoeLen = H * 0.115;   // final shoe length (Z)
  const soleH   = H * 0.015;   // sole thickness (Y)
  const upperH  = H * 0.040;   // upper height
  const bootH   = H * 0.210;   // boot shaft height
  // Scale factors for capsule → shoe sole/upper shapes
  const soleScX = shoeW   / (capR * 2);
  const soleScY = soleH   / (capLen + capR * 2);
  const soleScZ = shoeLen / (capR * 2);
  const upScX   = shoeW   * 0.88 / (capR * 2);
  const upScY   = upperH  / (capLen + capR * 2);
  const upScZ   = shoeLen * 0.84 / (capR * 2);

  return (
    <group>
      <primitive object={scene} />


      {/* ════ SKIRT ════
           Flared cylinder hidden when outfit is pants/shorts.
           Bottom meshes are made invisible so skin shows as legs. */}
      {isSkirt && (
        <mesh position={[0, skirtCY, 0]}>
          <cylinderGeometry args={[skirtTopR, skirtBotR, skirtH, 22, 1]} />
          <meshStandardMaterial
            color={bottomColor}
            roughness={bottomRough}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ════ SHOES ════
           Capsule geometry scaled to give a smooth rounded shoe silhouette.
           footXL/footXR come from detected foot positions (or proportional defaults). */}
      {([footXL, footXR] as const).map((footX, i) => (
        <group key={i}>
          {/* Sole — flat oval, elongated in Z */}
          <mesh
            position={[footX, modelBottom + soleH * 0.5, footZ]}
            scale={[soleScX, soleScY, soleScZ]}
          >
            <capsuleGeometry args={[capR, capLen, 6, 14]} />
            <meshStandardMaterial color="#111111" roughness={0.92} metalness={0} />
          </mesh>

          {/* Upper — slightly narrower + shorter than sole, rounded toe */}
          <mesh
            position={[footX, modelBottom + soleH + upperH * 0.5, footZ - shoeLen * 0.04]}
            rotation={[-0.06, 0, 0]}
            scale={[upScX, upScY, upScZ]}
          >
            <capsuleGeometry args={[capR, capLen, 8, 14]} />
            <meshStandardMaterial color={shoeColor} roughness={0.52} metalness={0.04} />
          </mesh>

          {/* Boot shaft */}
          {isBoot && (
            <mesh position={[footX, modelBottom + soleH + upperH + bootH * 0.5, footZ - shoeLen * 0.08]}>
              <cylinderGeometry args={[shoeW * 0.52, shoeW * 0.58, bootH, 12]} />
              <meshStandardMaterial color={shoeColor} roughness={0.52} metalness={0.04} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
