"use client";

// ─────────────────────────────────────────────────────────────────────────────
// WebStrands — glowing spider silk lines arcing across the sky. They brighten
// and pulse with the voices below.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Line, Sparkles } from "@react-three/drei";
import { audioBus } from "@/lib/invitation/audio-bus";
import { mulberry } from "./textures";

export function WebStrands() {
  const strands = useMemo(() => {
    const rnd = mulberry(99);
    return Array.from({ length: 9 }, () => {
      const x1 = (rnd() - 0.5) * 30;
      const z1 = -8 - rnd() * 22;
      const x2 = x1 + (rnd() - 0.5) * 26;
      const z2 = z1 - 4 - rnd() * 14;
      const sag = 1.5 + rnd() * 2.5;
      const mid: [number, number, number] = [
        (x1 + x2) / 2,
        7 + rnd() * 3 - sag,
        (z1 + z2) / 2,
      ];
      const pts = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x1, 7 + rnd() * 3, z1),
        new THREE.Vector3(...mid),
        new THREE.Vector3(x2, 7 + rnd() * 3, z2)
      )
        .getPoints(24)
        .map((p) => p.toArray() as [number, number, number]);
      return { pts, speed: 0.6 + rnd() * 1.4, phase: rnd() * Math.PI * 2 };
    });
  }, []);

  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const s = strands[i];
      if (!s) return;
      const mat = (child as any).material as THREE.Material & { opacity: number };
      const level = audioBus.micLevel + audioBus.guideLevel;
      const pulse =
        0.18 + level * 0.55 + 0.08 * Math.sin(t * s.speed * 2 + s.phase) + audioBus.boost * 0.15;
      mat.opacity = Math.min(0.95, pulse);
    });
  });

  return (
    <group ref={ref}>
      {strands.map((s, i) => (
        <Line
          key={i}
          points={s.pts}
          color="#ff5975"
          lineWidth={1.2}
          transparent
          opacity={0.25}
        />
      ))}
      {/* floating web dust */}
      <Sparkles
        count={70}
        scale={[26, 9, 18]}
        position={[0, 5, -14]}
        size={2.2}
        speed={0.35}
        color="#ffb3c0"
        opacity={0.7}
      />
    </group>
  );
}
