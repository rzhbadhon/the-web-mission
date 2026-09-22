// ─────────────────────────────────────────────────────────────────────────────
// audio-bus.ts — a tiny reactive audio bus.
//
// The 3D scene needs to react to voice activity and celebration pulses, but
// cannot be wired through React state without re-rendering every frame. This
// single mutable object is the bridge: the voice engine writes levels here,
// and r3f's useFrame reads them on every tick — no React reconciliation.
// ─────────────────────────────────────────────────────────────────────────────

export const audioBus: {
  micLevel: number; // 0..1 — how loud the guest's mic currently is
  guideLevel: number; // 0..1 — how loud the guide's TTS currently is
  boost: number; // celebration pulses (decays over time)
} = {
  micLevel: 0,
  guideLevel: 0,
  boost: 0,
};

/** Fire a celebration pulse (0..3 magnitude). Fireworks & Spidey react. */
export function pulse(magnitude = 1) {
  audioBus.boost = Math.min(3, audioBus.boost + magnitude);
}
