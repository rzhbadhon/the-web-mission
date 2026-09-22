"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BootCinematic — the first-load loading screen. Before the gate appears,
// Spider-Man swings across the night skyline on a silk thread, leaps in a
// somersault between rooftops, and the mission title rises. Pure CSS/SVG +
// framer-motion (no WebGL needed — it plays instantly, even while the 3D
// world warms up behind it).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";

const TITLE = "THE WEB MISSION";

/* deterministic pseudo-random — stars & skyline never reshuffle */
function seeded(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Spider-Man, upside-down on his thread (feet up, head down) */
function SpideyFigure({ dark = false }: { dark?: boolean }) {
  const red = dark ? "#1a0508" : "#c8102e";
  const blue = dark ? "#0a0a18" : "#1f3a93";
  const lens = dark ? "#2b2b40" : "#eaf6ff";
  return (
    <svg viewBox="0 0 44 66" className="h-auto w-[64px] drop-shadow-[0_0_12px_rgba(230,36,41,0.55)]">
      {/* legs — up, crossed at the thread */}
      <rect x="14" y="1" width="7" height="27" rx="3.5" fill={blue} />
      <rect x="23" y="1" width="7" height="27" rx="3.5" fill={blue} />
      {/* hips */}
      <rect x="15" y="26" width="14" height="8" rx="3" fill={blue} />
      {/* torso */}
      <rect x="14" y="32" width="16" height="16" rx="5" fill={red} />
      {/* chest spider */}
      <rect x="20.5" y="37" width="3" height="7" rx="1" fill={dark ? "#15151f" : "#0d0d14"} />
      <rect x="17.5" y="39.5" width="9" height="2" rx="1" fill={dark ? "#15151f" : "#0d0d14"} />
      {/* arms */}
      <rect x="5" y="33" width="7" height="18" rx="3.5" fill={red} transform="rotate(16 8.5 42)" />
      <rect x="32" y="33" width="7" height="18" rx="3.5" fill={red} transform="rotate(-16 35.5 42)" />
      {/* head — watching the city upside-down */}
      <circle cx="22" cy="56" r="8" fill={red} />
      <ellipse cx="18.6" cy="55" rx="2.7" ry="3.5" fill={lens} />
      <ellipse cx="25.4" cy="55" rx="2.7" ry="3.5" fill={lens} />
    </svg>
  );
}

/** night skyline silhouette with a few warm windows */
function Skyline({ layer }: { layer: 0 | 1 }) {
  const buildings = useMemo(
    () =>
      Array.from({ length: layer === 0 ? 16 : 11 }, (_, i) => {
        const w = 46 + seeded(i, layer ? 21 : 7) * 90;
        const h = (layer === 0 ? 90 : 150) + seeded(i, layer ? 33 : 11) * (layer === 0 ? 130 : 220);
        const windows = Array.from({ length: 5 }, (_, k) => ({
          x: 8 + seeded(i * 9 + k, layer ? 5 : 9) * (w - 20),
          y: 14 + seeded(i * 7 + k, layer ? 15 : 19) * (h - 30),
          on: seeded(i * 3 + k, layer ? 41 : 43) > 0.72,
        }));
        return { w, h, windows };
      }),
    [layer]
  );
  const color = layer === 0 ? "#0c0c18" : "#06060f";
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-end">
      {buildings.map((b, i) => (
        <div
          key={i}
          className="relative shrink-0"
          style={{
            width: b.w,
            height: b.h * (layer === 0 ? 0.45 : 0.62),
            background: color,
            marginRight: 6 + seeded(i, 3) * 14,
          }}
        >
          {/* rooftop antenna on some towers */}
          {seeded(i, 77) > 0.7 && (
            <div className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-white/15" />
          )}
          {/* warm windows */}
          {b.windows.map((win, k) =>
            win.on ? (
              <span
                key={k}
                className="wm-twinkle absolute h-[3px] w-[4px] rounded-[1px] bg-amber-200/70"
                style={{ left: win.x, top: win.y, animationDelay: `${-seeded(i * 5 + k, 13) * 4}s` }}
              />
            ) : null
          )}
        </div>
      ))}
    </div>
  );
}

export function BootCinematic({ onDone }: { onDone: () => void }) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const DURATION = reduced ? 900 : 3400;

  useEffect(() => {
    const t = setTimeout(onDone, DURATION);
    return () => clearTimeout(t);
  }, [onDone, DURATION]);

  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: `${seeded(i, 51) * 100}%`,
        top: `${seeded(i, 61) * 55}%`,
        size: 1 + seeded(i, 71) * 1.8,
        delay: `${-seeded(i, 81) * 5}s`,
      })),
    []
  );

  return (
    <motion.div
      key="boot"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.09, filter: "blur(9px)" }}
      transition={{ duration: 0.75, ease: "easeInOut" }}
      className="fixed inset-0 z-40 overflow-hidden bg-[radial-gradient(ellipse_120%_90%_at_70%_-10%,#141428_0%,#07070f_55%,#04040a_100%)]"
      aria-hidden="true"
    >
      {/* stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="wm-twinkle absolute rounded-full bg-white"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* moon */}
      <div className="absolute right-[12%] top-[10%] h-24 w-24 rounded-full bg-[radial-gradient(circle_at_38%_34%,#fff8e0,#ffeec4_45%,#e8d9a8_78%,#b8a97e)] shadow-[0_0_80px_28px_rgba(255,238,196,0.22)]" />

      {/* faint web strands from the top corners */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.16]" preserveAspectRatio="none">
        <line x1="0" y1="0" x2="30%" y2="52%" stroke="#f2b8c6" strokeWidth="1" />
        <line x1="100%" y1="0" x2="72%" y2="40%" stroke="#f2b8c6" strokeWidth="1" />
        <line x1="0" y1="0" x2="22%" y2="74%" stroke="#f2b8c6" strokeWidth="0.6" />
      </svg>

      {/* skyline — two parallax depths, rimmed with the city's red breath */}
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[radial-gradient(ellipse_70%_100%_at_50%_100%,rgba(230,36,41,0.16),transparent_70%)]" />
      <Skyline layer={0} />
      <Skyline layer={1} />

      {/* THE SWING — the anchor glides across the sky while Spidey
          pendulum-swings beneath it on his silk thread */}
      <motion.div
        className="absolute top-0 z-10"
        initial={{ left: "6%" }}
        animate={reduced ? { left: "46%" } : { left: ["6%", "40%", "72%", "58%"], y: [0, -10, 4, 0] }}
        transition={
          reduced
            ? { duration: 0.8 }
            : { duration: 3.1, times: [0, 0.38, 0.78, 1], ease: "easeInOut" }
        }
      >
        <motion.div
          className="origin-top"
          initial={{ rotate: -24 }}
          animate={reduced ? { rotate: 0 } : { rotate: [-26, 24, -18, 10, -6] }}
          transition={
            reduced
              ? { duration: 0.8 }
              : { duration: 3.2, times: [0, 0.3, 0.55, 0.8, 1], ease: "easeInOut" }
          }
        >
          {/* web anchor flash */}
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-300 shadow-[0_0_12px_rgba(230,36,41,0.9)]" />
          {/* silk thread */}
          <div className="mx-auto h-[30vh] w-[2px] bg-gradient-to-b from-white/60 via-white/30 to-white/55" />
          {/* Spidey hangs at the thread's end — big enough to read clearly */}
          <div className="relative flex justify-center">
            <span className="absolute top-1 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(230,36,41,0.35),transparent_65%)]" />
            <SpideyFigure />
          </div>
        </motion.div>
      </motion.div>

      {/* THE LEAP — a darker double somersaults across the rooftops */}
      {!reduced && (
        <motion.div
          className="absolute left-0 top-[34%] z-10 w-[56px]"
          initial={{ x: "-18vw", opacity: 0, rotate: 0 }}
          animate={{ x: "118vw", y: ["4vh", "-9vh", "7vh"], opacity: [0, 1, 1, 0], rotate: 420 }}
          transition={{ delay: 1.85, duration: 1.05, ease: "easeOut" }}
        >
          <SpideyFigure dark />
        </motion.div>
      )}

      {/* title + spinner */}
      <div className="absolute inset-x-0 bottom-[16%] z-20 flex flex-col items-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 18, letterSpacing: "0.1em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.32em" }}
          transition={{ delay: 0.55, duration: 1.1, ease: "easeOut" }}
          className="font-display text-center text-xl uppercase text-red-100 drop-shadow-[0_0_18px_rgba(230,36,41,0.5)] sm:text-3xl"
        >
          {TITLE}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="mt-3 font-mono text-[10px] uppercase tracking-[0.4em] text-white/40"
        >
          Spinning the web…
        </motion.p>

        {/* progress */}
        <div className="mt-6 h-[3px] w-44 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-300 shadow-[0_0_12px_rgba(230,36,41,0.8)]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: DURATION / 1000 - 0.3, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* client-only mount (dynamic ssr:false in MissionExperience) */
export default BootCinematic;
