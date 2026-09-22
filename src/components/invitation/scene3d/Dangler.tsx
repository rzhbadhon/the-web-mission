"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Dangler — a cute low-poly spider descending on a silk thread. The gate's
// little guardian. Sways playfully, reacts to name attempts with a jiggle.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { audioBus } from "@/lib/invitation/audio-bus";

export function Dangler() {
  const root = useRef<THREE.Group>(null);
  const spider = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (root.current) {
      // descend/retract with the mission stage energy
      root.current.rotation.z = Math.sin(t * 0.7) * 0.12 + audioBus.boost * 0.05 * Math.sin(t * 9);
    }
    if (spider.current) {
      spider.current.rotation.y = Math.sin(t * 0.9) * 0.5;
      spider.current.position.y = Math.sin(t * 0.55) * 0.18;
    }
  });

  const legMat = useRef<THREE.MeshStandardMaterial>(null);

  return (
    <group ref={root} position={[2.6, 0, -3.2]}>
      {/* silk thread from the sky */}
      <mesh position={[0, 3.4, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 6.8, 5]} />
        <meshStandardMaterial color="#e9e9f2" transparent opacity={0.65} roughness={0.9} />
      </mesh>

      <group ref={spider} position={[0, -0.2, 0]}>
        {/* abdomen */}
        <mesh position={[0, 0, -0.14]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#a4161a" roughness={0.45} metalness={0.25} />
        </mesh>
        {/* head */}
        <mesh position={[0, 0, 0.1]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="#7a0c14" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* eyes */}
        <mesh position={[0.05, 0.06, 0.2]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-0.05, 0.06, 0.2]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
        </mesh>
        {/* 8 legs (4 per side) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const side = i < 4 ? 1 : -1;
          const k = i % 4;
          const angle = -0.5 + k * 0.42;
          return (
            <group
              key={i}
              position={[side * 0.16, -0.02, 0.12 - k * 0.11]}
              rotation={[0, side * (Math.PI / 2 + angle * 0.4), angle]}
            >
              <mesh position={[side * 0.12, 0.03, 0]}>
                <cylinderGeometry args={[0.017, 0.023, 0.3, 6]} />
                <meshStandardMaterial
                  ref={i === 0 ? legMat : undefined}
                  color="#16161e"
                  roughness={0.6}
                />
              </mesh>
            </group>
          );
        })}
        {/* web-shooter hint on the back */}
        <mesh position={[0, 0.16, -0.2]} rotation={[-0.5, 0, 0]}>
          <torusGeometry args={[0.09, 0.02, 8, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ff5975" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}
