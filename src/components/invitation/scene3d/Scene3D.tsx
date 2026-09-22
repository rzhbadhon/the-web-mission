"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Scene3D — the whole cinematic night world: city, road, Spidey car, webs,
// moon, guardian spider, fireworks. The camera choreographs itself per stage
// and reacts to the guest's voice in real time.
// ─────────────────────────────────────────────────────────────────────────────

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import type { Stage } from "@/lib/invitation/config";
import { audioBus } from "@/lib/invitation/audio-bus";
import { City } from "./City";
import { SpideyCar } from "./SpideyCar";
import { SpiderSwing } from "./SpiderSwing";
import { WebStrands } from "./WebStrands";
import { Dangler } from "./Dangler";
import { Fireworks } from "./Fireworks";
import { glowTexture, roadTexture } from "./textures";

/* stage camera targets — chat stages frame BOTH the swinging hero above
   and the driving supercar below (verified framing: Spidey reads in the
   upper sky, clear of the chat bubbles) */
const CAMS: Record<Stage, { pos: [number, number, number]; look: [number, number, number] }> = {
  gate: { pos: [0, 2.6, 15.5], look: [0, 2.6, -8] },
  voice: { pos: [0, 2.1, 11], look: [0, 2.2, -6] },
  welcome: { pos: [2.8, 3.0, 10.5], look: [-0.8, 3.6, -3] },
  ielts: { pos: [-2.8, 3.4, 10.5], look: [0.8, 3.8, -3] },
  heart: { pos: [0, 2.7, 11.8], look: [0, 4.2, -3] },
  invite: { pos: [1.7, 1.6, 8.6], look: [-0.4, 2.7, -1.8] },
  booked: { pos: [0, 6.5, 17], look: [0, 3.5, -10] },
};

/* road scroll speed per stage — the rush builds, then hushes for the question */
const ROAD_SPEED: Record<Stage, number> = {
  gate: 0.6,
  voice: 0.9,
  welcome: 2.4,
  ielts: 2.7,
  heart: 3.2,
  invite: 2.2,
  booked: 3.4,
};

function CameraRig({ stage }: { stage: Stage }) {
  const look = useRef(new THREE.Vector3(0, 2.6, -8));

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const camera = state.camera as THREE.PerspectiveCamera;
    const pointer = state.pointer;
    const cam = CAMS[stage] ?? CAMS.gate;
    const k = Math.min(1, dt * 1.6);

    // responsive field of view (portrait phones need the wider view)
    const wantFov = state.size.width / state.size.height < 0.85 ? 70 : 55;
    if (camera.fov !== wantFov) {
      camera.fov = wantFov;
      camera.updateProjectionMatrix();
    }

    // gentle parallax with pointer + float with time
    const px = pointer.x * 0.6;
    const py = pointer.y * 0.35;
    const floatY = Math.sin(t * 0.5) * 0.12;
    const voiceShake = audioBus.micLevel * 0.05 * Math.sin(t * 47);
    const voiceShakeY = audioBus.micLevel * 0.04 * Math.cos(t * 39);
    // slow orbital drift — the view itself never stands still
    const drift = Math.sin(t * 0.1) * 0.85;

    camera.position.x += (cam.pos[0] + px + drift + voiceShake - camera.position.x) * k;
    camera.position.y += (cam.pos[1] + py + floatY + voiceShakeY - camera.position.y) * k;
    camera.position.z += (cam.pos[2] - camera.position.z) * k;

    look.current.x += (cam.look[0] - look.current.x) * k;
    look.current.y += (cam.look[1] - look.current.y) * k;
    look.current.z += (cam.look[2] - look.current.z) * k;
    camera.lookAt(look.current);
  });
  return null;
}

function Road({ stage }: { stage: Stage }) {
  // build the texture (setup happens inside the factory — compiler-safe)
  const tex = useMemo(() => {
    const t = roadTexture();
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(10, 1);
    return t;
  }, []);
  // runtime handle for the per-frame scroll (refs are the escape hatch)
  const texRef = useRef<THREE.CanvasTexture | null>(tex);
  useEffect(() => {
    texRef.current = tex;
    return () => {
      tex.dispose();
      texRef.current = null;
    };
  }, [tex]);

  useFrame((_, dt) => {
    const t = texRef.current;
    if (!t) return;
    const speed = ROAD_SPEED[stage] ?? 1;
    t.offset.x -= dt * speed * 0.28;
  });

  return (
    <group>
      {/* asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[120, 4.6]} />
        <meshStandardMaterial map={tex} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[240, 240]} />
        <meshStandardMaterial color="#08080e" roughness={1} />
      </mesh>
    </group>
  );
}

function Moon() {
  const sprite = useRef<THREE.Sprite>(null);
  const tex = useMemo(() => glowTexture("#fff3d6"), []);
  useFrame((state) => {
    if (!sprite.current) return;
    const t = state.clock.elapsedTime;
    const breathe = 1 + audioBus.guideLevel * 0.12 + Math.sin(t * 0.8) * 0.02;
    sprite.current.scale.set(7 * breathe, 7 * breathe, 1);
  });
  return (
    <group>
      <sprite ref={sprite} position={[-11, 10.5, -26]} scale={[7, 7, 1]}>
        <spriteMaterial map={tex} transparent depthWrite={false} />
      </sprite>
      {/* stars */}
      <Sparkles
        count={130}
        scale={[70, 22, 40]}
        position={[0, 14, -18]}
        size={1.6}
        speed={0.18}
        color="#ffffff"
        opacity={0.85}
      />
    </group>
  );
}

export default function Scene3D({ stage }: { stage: Stage }) {
  return (
    // z-0 — above main's background paint, below the z-10 conversation UI:
    // the 3D world is fully visible while chat bubbles stay readable on top.
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.8]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 2.6, 15.5], fov: 55, near: 0.1, far: 120 }}
      >
        <color attach="background" args={["#07070d"]} />
        <fog attach="fog" args={["#07070d", 10, 46]} />

        <ambientLight intensity={0.5} color="#3b3b52" />
        <hemisphereLight args={["#23233a", "#0a0a10", 0.55]} />
        <directionalLight position={[-9, 13, -7]} intensity={0.9} color="#dfe4ff" />
        {/* cinematic spidey-red backlights */}
        <pointLight position={[-4.5, 1.8, -3]} color="#e62429" intensity={5} distance={13} />
        <pointLight position={[4.5, 1.2, -5]} color="#ff5975" intensity={3.5} distance={11} />

        <Suspense fallback={null}>
          <City />
          <Road stage={stage} />
          <SpideyCar stage={stage} />
          <SpiderSwing stage={stage} />
          <WebStrands />
          <Moon />
          <Dangler />
          <Fireworks celebrating={stage === "booked"} />
        </Suspense>

        <CameraRig stage={stage} />
      </Canvas>
    </div>
  );
}
