"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SpiderSwing — THE Spider-Man. He hangs upside-down from a silk thread high
// above the road, swinging in a slow pendulum arc while the conversation runs.
// He reacts to the guest: the guest's voice widens the arc, the guide's voice makes him
// turn, and a celebration sends him spinning.
//
// Built to three-best-practices: shared memoized materials, zero per-frame
// allocations, refs-only animation, disposal on unmount.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { audioBus } from "@/lib/invitation/audio-bus";
import type { Stage } from "@/lib/invitation/config";

const RED = "#c8102e";
const BLUE = "#1f3a93";
const DARK = "#0d0d14";

export function SpiderSwing({ stage }: { stage: Stage }) {
  /* the pivot hangs high above the road; everything swings around it */
  const pivot = useRef<THREE.Group>(null);
  const thread = useRef<THREE.Mesh>(null);
  const figure = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const spin = useRef(0); // celebration spin velocity

  /* swing energy is louder once the real conversation starts; on "booked"
   * he descends into the frame to celebrate right beside the fireworks */
  const chatStage =
    stage === "welcome" || stage === "ielts" || stage === "heart" || stage === "invite";
  const energy = chatStage ? 1 : stage === "booked" ? 1.25 : 0.55;
  /* booked choreography is viewport-aware (computed per-frame in useFrame):
   *   desktop — he hangs in the free sky beside the ticket, clearly visible
   *   mobile  — the ticket rules the screen; he tucks up high to peek */

  /* shared materials — one set for the whole hero */
  const mats = useMemo(() => {
    const red = new THREE.MeshStandardMaterial({ color: RED, roughness: 0.42, metalness: 0.12 });
    const blue = new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.5, metalness: 0.1 });
    const dark = new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.7 });
    const lens = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#dff6ff",
      emissiveIntensity: 1.5,
      roughness: 0.25,
    });
    const silk = new THREE.MeshStandardMaterial({
      color: "#e9e9f2",
      transparent: true,
      opacity: 0.55,
      roughness: 0.9,
    });
    return { red, blue, dark, lens, silk };
  }, []);

  /* dispose — never leak GPU memory */
  useEffect(() => {
    const m = mats;
    return () => {
      Object.values(m).forEach((mat) => mat.dispose());
    };
  }, [mats]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const mic = audioBus.micLevel; // the guest's voice
    const guide = audioBus.guideLevel; // the guide's voice
    const boost = audioBus.boost; // celebration pulses

    /* celebration spin momentum (decays, re-energised by pulses) */
    spin.current += boost * dt * 6;
    spin.current *= 1 - Math.min(0.9, dt * 1.2);

    if (pivot.current) {
      /* booked choreography adapts to the viewport — beside the ticket on
       * desktop, tucked into the top sky band on phones */
      const portrait = state.size.width / state.size.height < 0.85;
      const pivotX = stage === "booked" ? (portrait ? -1.0 : -7.6) : 0;
      const pivotY = stage === "booked" ? (portrait ? 13.2 : 9.8) : 10.6;

      /* the pendulum — amplitude & speed grow with the guest's voice */
      const amp = (0.30 + mic * 0.22 + guide * 0.1) * energy;
      const speed = 0.55 + mic * 0.9 + guide * 0.5;
      pivot.current.rotation.z = Math.sin(t * speed) * amp;
      /* gentle drift of the whole anchor so he tours the skyline — a touch
       * wider during the conversation so the sky feels alive;
       * during the celebration he parks beside the ticket in the firework sky */
      pivot.current.position.x = pivotX + Math.sin(t * 0.16) * (stage === "booked" ? 0.5 : 1.8);
      /* smooth glide into the booked-stage pose + hero scale-up
       * so the peeking Spidey reads clearly against the night sky */
      pivot.current.position.y += (pivotY - pivot.current.position.y) * Math.min(1, dt * 1.4);
      const wantScale = stage === "booked" ? 1.5 : 1;
      const s = pivot.current.scale.x + (wantScale - pivot.current.scale.x) * Math.min(1, dt * 2);
      pivot.current.scale.setScalar(s);
    }

    if (thread.current && figure.current) {
      /* bungee bounce — the thread stretches a little at the arc's end;
       * during the celebration he climbs his own thread to lurk, peek and swing */
      const portrait = state.size.width / state.size.height < 0.85;
      const retract = stage === "booked" ? (portrait ? 0.24 : 0.52) : 1;
      const bounce = 1 + Math.sin(t * 1.25) * 0.012 + mic * 0.045;
      const len = retract * bounce;
      thread.current.scale.y = len;
      thread.current.position.y = -2.45 * len; // stay anchored at the pivot
      figure.current.position.y = -4.9 * len; // ride up with the thread
    }

    if (figure.current) {
      /* he sways against the swing + spins when the mission celebrates */
      figure.current.rotation.y =
        Math.sin(t * 0.7) * 0.35 + guide * 0.5 * Math.sin(t * 3.1) + spin.current;
      /* voice pushes him gently outward from the thread */
      figure.current.rotation.z = mic * 0.12 * Math.sin(t * 5.3);
    }

    if (head.current) {
      /* the iconic upside-down look-at-you tilt */
      head.current.rotation.x = 0.35 + Math.sin(t * 0.9) * 0.1 + mic * 0.15;
    }
  });

  return (
    <group ref={pivot} position={[0, 10.6, -3.4]}>
      {/* silk thread (stretched by scale.y each frame) */}
      <mesh ref={thread} position={[0, -2.45, 0]} material={mats.silk}>
        <cylinderGeometry args={[0.014, 0.02, 4.9, 5]} />
      </mesh>

      {/* the hero, upside-down, ankles at the thread's end */}
      <group ref={figure} position={[0, -4.9, 0]}>
        {/* boots crossed at the ankle point */}
        <mesh position={[0.16, 0.05, 0]} rotation={[0, 0, 0.18]} material={mats.red}>
          <capsuleGeometry args={[0.09, 0.28, 4, 10]} />
        </mesh>
        <mesh position={[-0.16, 0.05, 0]} rotation={[0, 0, -0.18]} material={mats.red}>
          <capsuleGeometry args={[0.09, 0.28, 4, 10]} />
        </mesh>

        {/* legs — blue, knees bent so the silhouette reads "hanging" */}
        <mesh position={[0.2, -0.42, 0.05]} rotation={[0.25, 0, -0.22]} material={mats.blue}>
          <capsuleGeometry args={[0.1, 0.62, 4, 10]} />
        </mesh>
        <mesh position={[-0.2, -0.42, 0.05]} rotation={[0.25, 0, 0.22]} material={mats.blue}>
          <capsuleGeometry args={[0.1, 0.62, 4, 10]} />
        </mesh>

        {/* hips */}
        <mesh position={[0, -0.82, 0]} material={mats.blue}>
          <boxGeometry args={[0.42, 0.24, 0.3]} />
        </mesh>

        {/* torso — red wedge, wider at the shoulders */}
        <mesh position={[0, -1.14, 0]} material={mats.red}>
          <boxGeometry args={[0.5, 0.42, 0.32]} />
        </mesh>
        <mesh position={[0, -1.42, 0]} material={mats.red}>
          <boxGeometry args={[0.56, 0.18, 0.34]} />
        </mesh>
        {/* chest emblem — the tiny spider */}
        <mesh position={[0, -1.2, 0.175]} material={mats.dark}>
          <boxGeometry args={[0.16, 0.05, 0.01]} />
        </mesh>
        <mesh position={[0, -1.2, 0.175]} material={mats.dark}>
          <boxGeometry args={[0.05, 0.18, 0.01]} />
        </mesh>

        {/* arms — hanging down beside the torso, slightly out */}
        <mesh position={[0.36, -1.32, 0.02]} rotation={[0, 0, -0.5]} material={mats.red}>
          <capsuleGeometry args={[0.075, 0.6, 4, 10]} />
        </mesh>
        <mesh position={[-0.36, -1.32, 0.02]} rotation={[0, 0, 0.5]} material={mats.red}>
          <capsuleGeometry args={[0.075, 0.6, 4, 10]} />
        </mesh>
        {/* web-shooter gloves — small dark hands */}
        <mesh position={[0.5, -1.68, 0.02]} material={mats.dark}>
          <sphereGeometry args={[0.08, 10, 10]} />
        </mesh>
        <mesh position={[-0.5, -1.68, 0.02]} material={mats.dark}>
          <sphereGeometry args={[0.08, 10, 10]} />
        </mesh>

        {/* the head — tilted to look at the guest through the upside-down world */}
        <group ref={head} position={[0, -1.78, 0.02]}>
          <mesh material={mats.red}>
            <sphereGeometry args={[0.24, 18, 18]} />
          </mesh>
          {/* big lens eyes — the unmistakable silhouette */}
          <mesh position={[0.13, 0.05, 0.17]} rotation={[0, 0.5, 0.35]} material={mats.lens}>
            <sphereGeometry args={[0.095, 12, 12]} />
          </mesh>
          <mesh position={[-0.13, 0.05, 0.17]} rotation={[0, -0.5, -0.35]} material={mats.lens}>
            <sphereGeometry args={[0.095, 12, 12]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
