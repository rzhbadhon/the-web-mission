"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/page.tsx — the single entry point. Wraps the whole experience in a
// dynamic Suspense because MissionExperience reads search params (the ?admin=
// key) and that requires a client boundary.
// ─────────────────────────────────────────────────────────────────────────────

import dynamic from "next/dynamic";

const MissionExperience = dynamic(
  () => import("@/components/invitation/MissionExperience").then((m) => m.MissionExperience),
  { ssr: false, loading: () => null }
);

export default function Page() {
  return <MissionExperience />;
}
