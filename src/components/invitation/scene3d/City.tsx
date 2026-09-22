"use client";

// ─────────────────────────────────────────────────────────────────────────────
// City — instanced skyscraper silhouettes with lit windows + fog.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { windowTexture, mulberry } from "./textures";
import { audioBus } from "@/lib/invitation/audio-bus";

const BUILDINGS = 46;

export function City() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const tex = useMemo(() => windowTexture(), []);

  const buildings = useMemo(() => {
    const rnd = mulberry(1234);
    const arr: {
      pos: [number, number, number];
      scale: [number, number, number];
      rot: number;
    }[] = [];
    // two skyline rows flanking the road corridor
    for (let i = 0; i < BUILDINGS; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = (rnd() - 0.5) * 60;
      const z = -6 - rnd() * 40;
      const w = 1.6 + rnd() * 2.6;
      const h = 2.5 + rnd() * 7.5;
      const d = 1.6 + rnd() * 2.4;
      arr.push({
        pos: [side === -1 ? x - 10 - rnd() * 8 : x + 10 + rnd() * 8, h / 2, z],
        scale: [w, h, d],
        rot: 0,
      });
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (!matRef.current) return;
    // windows glow brighter with the guest's voice — the city listens
    const target = 0.72 + audioBus.micLevel * 0.9 + audioBus.guideLevel * 0.35;
    matRef.current.emissiveIntensity +=
      (target - matRef.current.emissiveIntensity) * Math.min(1, dt * 5);
  });

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={b.pos} rotation={[0, b.rot, 0]}>
          <boxGeometry args={b.scale} />
          <meshStandardMaterial
            ref={i === 0 ? matRef : undefined}
            color="#0f0f18"
            map={tex}
            emissiveMap={tex}
            emissive="#ffb36b"
            emissiveIntensity={0.72}
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}
