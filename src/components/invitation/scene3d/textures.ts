// ─────────────────────────────────────────────────────────────────────────────
// Procedural canvas textures — zero external assets, everything generated.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from "three";

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

/** Deterministic pseudo-random (same scene every load) */
export function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Skyscraper facade: dark glass + randomly lit warm windows */
export function windowTexture(): THREE.CanvasTexture {
  const { c, ctx } = makeCanvas(128, 256);
  const rnd = mulberry(42);
  ctx.fillStyle = "#0b0b12";
  ctx.fillRect(0, 0, 128, 256);
  const cols = 6;
  const rows = 16;
  const cw = 128 / cols;
  const ch = 256 / rows;
  const warm = ["#ffd9a0", "#ffb36b", "#ff9d6b", "#ffe9c9", "#ff8fa3"];
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      if (rnd() > 0.55) {
        ctx.fillStyle = warm[Math.floor(rnd() * warm.length)];
        ctx.globalAlpha = 0.35 + rnd() * 0.65;
        ctx.fillRect(col * cw + 3, r * ch + 3, cw - 6, ch - 7);
      }
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Spider-web pattern (transparent) — car decal + gate emblem */
export function webTexture(bg = false): THREE.CanvasTexture {
  const { c, ctx } = makeCanvas(256, 256);
  if (bg) {
    ctx.fillStyle = "#7f0d17";
    ctx.fillRect(0, 0, 256, 256);
  }
  ctx.strokeStyle = bg ? "rgba(255,255,255,0.92)" : "#ffffff";
  ctx.lineWidth = bg ? 3 : 2;
  const cx = 128;
  const cy = 128;
  // radial spokes
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 126, cy + Math.sin(a) * 126);
    ctx.stroke();
  }
  // concentric web arcs
  for (let r = 18; r <= 126; r += 18) {
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const wobble = 1 + 0.06 * Math.sin(i / 4);
      const x = cx + Math.cos(a) * r * wobble;
      const y = cy + Math.sin(a) * r * wobble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Night road: asphalt + dashed centre line + red neon edges (runs along x) */
export function roadTexture(): THREE.CanvasTexture {
  const { c, ctx } = makeCanvas(1024, 256);
  ctx.fillStyle = "#0d0d13";
  ctx.fillRect(0, 0, 1024, 256);
  // subtle noise
  const rnd = mulberry(7);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rnd() * 0.04})`;
    ctx.fillRect(rnd() * 1024, rnd() * 256, 2, 2);
  }
  // centre dashes running along the road (x)
  ctx.fillStyle = "#ffe9b0";
  for (let x = 0; x < 1024; x += 128) {
    ctx.fillRect(x, 124, 72, 8);
  }
  // neon edges (top + bottom borders of the road)
  const gradT = ctx.createLinearGradient(0, 0, 0, 26);
  gradT.addColorStop(0, "#e62429");
  gradT.addColorStop(1, "rgba(230,36,41,0)");
  ctx.fillStyle = gradT;
  ctx.fillRect(0, 0, 1024, 26);
  const gradB = ctx.createLinearGradient(0, 230, 0, 256);
  gradB.addColorStop(0, "rgba(230,36,41,0)");
  gradB.addColorStop(1, "#e62429");
  ctx.fillStyle = gradB;
  ctx.fillRect(0, 230, 1024, 26);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial glow — moon, headlights, fireworks */
export function glowTexture(color = "#ffffff"): THREE.CanvasTexture {
  const { c, ctx } = makeCanvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color + "aa");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
