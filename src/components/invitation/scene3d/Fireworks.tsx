"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Fireworks — celebration particles for the big YES. Hand-rolled instanced
// simulation (no postprocessing — mobile friendly).
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { audioBus } from "@/lib/invitation/audio-bus";

const COUNT = 240;
const COLORS = ["#ff3040", "#ffd166", "#ffffff", "#ff5975", "#ff9d6b"];

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

function makeParticles(): Particle[] {
  return Array.from({ length: COUNT }, () => ({
    pos: new THREE.Vector3(0, -999, 0),
    vel: new THREE.Vector3(),
    life: 0,
    maxLife: 1,
    color: new THREE.Color("#ffffff"),
    size: 0.12,
  }));
}

export function Fireworks({ celebrating = false }: { celebrating?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const burstClock = useRef(0);
  const pool = useRef(0);
  const particles = useRef<Particle[]>(makeParticles());

  useFrame((state, dt) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    // while booked, the sky celebrates all night (gentler cadence);
    // boost pulses (the YES moment) fire rapid bursts on top
    const active = celebrating || audioBus.boost > 0.2;

    // spawn a fresh burst periodically while celebrating
    burstClock.current += dt;
    const interval = audioBus.boost > 0.2 ? 0.75 : 1.7;
    if (active && burstClock.current > interval) {
      burstClock.current = 0;
      const cx = (Math.random() - 0.5) * 22;
      const cy = 6 + Math.random() * 4;
      const cz = -10 - Math.random() * 12;
      const color = new THREE.Color(
        COLORS[Math.floor(Math.random() * COLORS.length)]
      );
      const n = 36;
      for (let i = 0; i < n; i++) {
        const p = particles.current[pool.current % COUNT];
        pool.current++;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 2.2 + Math.random() * 2.6;
        p.pos.set(cx, cy, cz);
        p.vel.set(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 1.2,
          Math.sin(phi) * Math.sin(theta) * speed
        );
        p.life = 0;
        p.maxLife = 1.4 + Math.random() * 0.9;
        p.color.copy(color).offsetHSL(0, 0, (Math.random() - 0.5) * 0.15);
        p.size = 0.08 + Math.random() * 0.1;
      }
    }

    // simulate
    particles.current.forEach((p, i) => {
      if (p.life < p.maxLife) {
        p.life += dt;
        p.vel.y -= 1.6 * dt; // gravity
        p.vel.multiplyScalar(1 - 0.35 * dt); // drag
        p.pos.addScaledVector(p.vel, dt);
        const k = Math.max(0, 1 - p.life / p.maxLife);
        dummy.position.copy(p.pos);
        const s = p.size * (0.4 + k);
        dummy.scale.setScalar(s);
        dummy.quaternion.setFromEuler(
          new THREE.Euler(t * 2 + i, t * 1.4 + i, 0)
        );
      } else {
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0.001);
      }
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
      mesh.current!.setColorAt(i, p.color);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;

    // decay boost over time
    audioBus.boost = Math.max(0, audioBus.boost - dt * 0.5);
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        toneMapped={false}
        emissiveIntensity={1}
        vertexColors
        emissive="#ffffff"
      />
    </instancedMesh>
  );
}
