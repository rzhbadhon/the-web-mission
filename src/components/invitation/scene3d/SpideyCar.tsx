"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SpideyCar — the supercar. A single smooth extruded hypercar silhouette
// (no stacked boxes, no cartoon flames): long low nose, glass fastback
// canopy, carbon aero, full-width LED light bars and a subtle neon underglow.
// It cruises smoothly across lanes while the journey rises — but it stays
// LOW in the frame: Spider-Man above is the hero of this city.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { webTexture, glowTexture } from "./textures";
import { audioBus } from "@/lib/invitation/audio-bus";
import type { Stage } from "@/lib/invitation/config";

const RED = "#c8102e";
const CARBON = "#101017";

/* cruise energy per stage — the rush builds with the story */
const DRIVE: Record<Stage, number> = {
  gate: 0.5,
  voice: 0.7,
  welcome: 1,
  ielts: 1.15,
  heart: 1.3,
  invite: 2.2,
  booked: 1.6,
};

/* the car sits back and low — Spidey owns the skyline above */
const BASE_Z = -1.7;
const CAR_SCALE = 0.94;

/** hypercar side profile — one continuous curve, ground at y = 0 */
function bodyShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(2.16, 0.14); // splitter tip
  s.quadraticCurveTo(2.3, 0.3, 2.02, 0.42); // ultra-low nose
  s.quadraticCurveTo(1.35, 0.55, 0.82, 0.64); // long hood, fender crest
  s.quadraticCurveTo(0.3, 0.98, -0.32, 1.04); // raked windshield → roof
  s.quadraticCurveTo(-0.95, 1.02, -1.62, 0.7); // fastback sweep
  s.quadraticCurveTo(-2.02, 0.64, -2.12, 0.52); // rear haunch
  s.lineTo(-2.12, 0.24); // tail cut
  s.quadraticCurveTo(-1.55, 0.13, -0.9, 0.13); // diffuser underside
  s.lineTo(0.9, 0.13);
  s.quadraticCurveTo(1.8, 0.13, 2.16, 0.14); // front underside
  return s;
}

/** tinted glass canopy — windshield + roof + rear glass as one wedge */
function canopyShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.58, 0.62);
  s.quadraticCurveTo(0.24, 0.94, -0.32, 1.0);
  s.quadraticCurveTo(-0.9, 0.98, -1.5, 0.68);
  s.lineTo(-1.05, 0.64);
  s.quadraticCurveTo(-0.35, 0.86, 0.32, 0.62);
  s.closePath();
  return s;
}

export function SpideyCar({ stage }: { stage: Stage }) {
  const group = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const headlightL = useRef<THREE.PointLight>(null);
  const headlightR = useRef<THREE.PointLight>(null);
  const underglow = useRef<THREE.PointLight>(null);
  const wake = useRef<THREE.Sprite>(null);
  const webDecal = useMemo(() => webTexture(true), []);
  const wakeTex = useMemo(() => glowTexture("#ff2038"), []);

  /* geometries — one smooth extrusion each */
  const geos = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(bodyShape(), {
      depth: 1.4,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.09,
      bevelSegments: 3,
      curveSegments: 16,
    });
    body.translate(0, 0, -0.7); // centre the width on z
    const canopy = new THREE.ExtrudeGeometry(canopyShape(), {
      depth: 1.18,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
      curveSegments: 12,
    });
    canopy.translate(0, 0.03, -0.59);
    return { body, canopy };
  }, []);

  /* shared materials — disposed on unmount */
  const mats = useMemo(() => {
    const body = new THREE.MeshStandardMaterial({
      color: RED,
      metalness: 0.72,
      roughness: 0.22,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: "#0a1018",
      metalness: 0.9,
      roughness: 0.08,
    });
    const carbon = new THREE.MeshStandardMaterial({
      color: CARBON,
      metalness: 0.5,
      roughness: 0.42,
    });
    const lampWhite = new THREE.MeshStandardMaterial({
      color: "#fff7e0",
      emissive: "#ffe9b0",
      emissiveIntensity: 3,
    });
    const lampRed = new THREE.MeshStandardMaterial({
      color: "#ff2038",
      emissive: "#ff2038",
      emissiveIntensity: 2.6,
    });
    const skirt = new THREE.MeshStandardMaterial({
      color: "#ff3040",
      emissive: "#ff2038",
      emissiveIntensity: 1.8,
    });
    const glow = new THREE.MeshBasicMaterial({
      color: "#ff2038",
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return { body, glass, carbon, lampWhite, lampRed, skirt, glow };
  }, []);

  useEffect(() => {
    const g = geos;
    const m = mats;
    return () => {
      g.body.dispose();
      g.canopy.dispose();
      Object.values(m).forEach((mat) => mat.dispose());
      webDecal.dispose();
      wakeTex.dispose();
    };
  }, [geos, mats, webDecal, wakeTex]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const drive = DRIVE[stage] ?? 1;
    const mic = audioBus.micLevel;
    const guide = audioBus.guideLevel;

    if (group.current) {
      /* SMOOTH LANE CRUISE — the car glides across the road, no jitter */
      const weaveAmp = 0.42 + drive * 0.3;
      const weaveSpeed = 0.3 + drive * 0.13;
      const x = Math.sin(t * weaveSpeed) * weaveAmp;
      const surge = Math.sin(t * weaveSpeed * 2 + 1.2) * 0.12 * drive;
      const energy = mic * 0.05 + guide * 0.03 + audioBus.boost * 0.02;
      group.current.position.x = x;
      group.current.position.z = BASE_Z + surge;
      group.current.position.y = 0.02 + Math.sin(t * 1.9) * 0.01 + energy;
      /* elegant body roll into the lane change */
      group.current.rotation.z = -Math.cos(t * weaveSpeed) * 0.032 * drive;
      /* slight yaw steering into the lane change */
      group.current.rotation.y = -0.3 + Math.cos(t * weaveSpeed) * 0.07 * drive;
      const wantScale = CAR_SCALE;
      const s = group.current.scale.x + (wantScale - group.current.scale.x) * Math.min(1, dt * 2);
      group.current.scale.setScalar(s);
    }

    /* wheels blur with speed */
    const spin = (1.4 + drive * 5.2 + audioBus.boost * 4) * dt * 6;
    wheels.current.forEach((w) => {
      if (w) w.rotation.x -= spin;
    });

    /* headlights breathe with the guide's voice */
    const glowI = 2.0 + guide * 4.5 + mic * 2 + drive * 0.8;
    if (headlightL.current) headlightL.current.intensity = glowI;
    if (headlightR.current) headlightR.current.intensity = glowI;

    /* underglow pulses with the beat of the mission */
    if (underglow.current) {
      underglow.current.intensity = 1.2 + drive * 0.9 + Math.sin(t * 2.0) * 0.35 + audioBus.boost * 2.5;
    }

    /* the speed-wake — a clean streak of red light trailing the car */
    if (wake.current) {
      const w = 2.6 + drive * 1.6 + audioBus.boost * 1.5;
      const flick = 0.75 + Math.sin(t * 17) * 0.12 + Math.sin(t * 41) * 0.06;
      wake.current.scale.set(w * 1.5, 0.55 * flick, 1);
      (wake.current.material as THREE.SpriteMaterial).opacity =
        0.28 + drive * 0.16 + audioBus.boost * 0.12;
    }
  });

  return (
    <group ref={group} position={[0, 0, BASE_Z]} rotation={[0, -0.3, 0]} scale={CAR_SCALE}>
      {/* the smooth hypercar body */}
      <mesh geometry={geos.body} material={mats.body} castShadow />

      {/* tinted glass canopy */}
      <mesh geometry={geos.canopy} material={mats.glass} />

      {/* carbon aero — front splitter + rear diffuser */}
      <mesh position={[2.02, 0.1, 0]} material={mats.carbon}>
        <boxGeometry args={[0.34, 0.07, 1.62]} />
      </mesh>
      <mesh position={[-2.0, 0.11, 0]} material={mats.carbon}>
        <boxGeometry args={[0.3, 0.1, 1.5]} />
      </mesh>

      {/* side skirts with a thin neon vein (the guest likes sports cars) */}
      <mesh position={[0, 0.11, 0.74]} material={mats.skirt}>
        <boxGeometry args={[2.6, 0.035, 0.03]} />
      </mesh>
      <mesh position={[0, 0.11, -0.74]} material={mats.skirt}>
        <boxGeometry args={[2.6, 0.035, 0.03]} />
      </mesh>

      {/* side intake scoops */}
      <mesh position={[0.35, 0.42, 0.72]} rotation={[0, 0, -0.18]} material={mats.carbon}>
        <boxGeometry args={[0.8, 0.16, 0.1]} />
      </mesh>
      <mesh position={[0.35, 0.42, -0.72]} rotation={[0, 0, -0.18]} material={mats.carbon}>
        <boxGeometry args={[0.8, 0.16, 0.1]} />
      </mesh>

      {/* active rear wing on swept struts */}
      <mesh position={[-1.7, 0.86, 0]} material={mats.carbon}>
        <boxGeometry args={[0.34, 0.045, 1.42]} />
      </mesh>
      <mesh position={[-1.66, 0.72, 0.5]} rotation={[0.3, 0, 0]} material={mats.carbon}>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
      </mesh>
      <mesh position={[-1.66, 0.72, -0.5]} rotation={[-0.3, 0, 0]} material={mats.carbon}>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
      </mesh>

      {/* spider-web decal on the hood */}
      <mesh position={[1.3, 0.565, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshStandardMaterial
          map={webDecal}
          transparent
          opacity={0.88}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* full-width front LED light bar */}
      <mesh position={[2.12, 0.36, 0]} material={mats.lampWhite}>
        <boxGeometry args={[0.05, 0.045, 1.15]} />
      </mesh>
      {/* full-width rear LED light bar */}
      <mesh position={[-2.14, 0.44, 0]} material={mats.lampRed}>
        <boxGeometry args={[0.05, 0.06, 1.3]} />
      </mesh>

      {/* headlight glow sprites + lights */}
      <sprite position={[2.3, 0.37, 0.42]} scale={[0.9, 0.5, 1]}>
        <spriteMaterial map={wakeTex} color="#ffe9b0" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite position={[2.3, 0.37, -0.42]} scale={[0.9, 0.5, 1]}>
        <spriteMaterial map={wakeTex} color="#ffe9b0" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight
        ref={headlightL}
        position={[2.3, 0.42, 0.5]}
        color="#ffe9b0"
        intensity={2.2}
        distance={7}
      />
      <pointLight
        ref={headlightR}
        position={[2.3, 0.42, -0.5]}
        color="#ffe9b0"
        intensity={2.2}
        distance={7}
      />

      {/* NEON UNDERGLOW — floats on a pool of red light, subtle */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.glow}>
        <planeGeometry args={[3.6, 1.7]} />
      </mesh>
      <pointLight
        ref={underglow}
        position={[0, 0.32, 0]}
        color="#ff2038"
        intensity={1.6}
        distance={5.5}
      />

      {/* the speed-wake — one clean streak of light, no cartoon flames */}
      <sprite ref={wake} position={[-3.1, 0.45, 0]} scale={[4.2, 0.55, 1]}>
        <spriteMaterial
          map={wakeTex}
          color="#ff2038"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* faint speed trail */}
      <Sparkles
        count={22}
        scale={[3.0, 0.8, 2.0]}
        position={[-3.2, 0.5, 0]}
        size={2.0}
        speed={2.0}
        color="#ff5975"
        opacity={0.45}
      />

      {/* wheels — low-profile rubber, glowing rims */}
      {(
        [
          [1.42, 0.76],
          [1.42, -0.76],
          [-1.38, 0.76],
          [-1.38, -0.76],
        ] as const
      ).map(([x, z], i) => (
        <group key={i} ref={(el) => { if (el) wheels.current[i] = el; }} position={[x, 0.31, z]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mats.carbon}>
            <cylinderGeometry args={[0.31, 0.31, 0.24, 20]} />
          </mesh>
          {/* rim glow disc */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[z > 0 ? 0.1 : -0.1, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.05, 14]} />
            <meshStandardMaterial
              color="#ff3040"
              emissive="#ff2038"
              emissiveIntensity={1.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
