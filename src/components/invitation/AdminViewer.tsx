"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AdminViewer — the hidden mission log. Visit /?admin=<ADMIN_KEY> (defined in
// .env, default: "spidey") to see every journey: what name was typed, how far
// it went, and the exact moment they said YES. Useful for the host to peek at
// the results without breaking the surprise.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Search, Fingerprint, CheckCircle2, Hourglass } from "lucide-react";

interface JourneyRow {
  id: string;
  nameEntered: string;
  nameMatched: string | null;
  stage: string;
  accepted: boolean;
  createdAt: string;
  updatedAt: string;
  transcript: { role: string; content: string; source?: string }[];
}

const STAGE_LABELS: Record<string, string> = {
  gate: "At the gate",
  voice: "Voice check",
  welcome: "Mission brief",
  ielts: "IELTS trial",
  heart: "Web of the heart",
  invite: "The big question",
  booked: "BOOKED — they said YES",
};

export function AdminViewer({ passkey }: { passkey: string }) {
  const [rows, setRows] = useState<JourneyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/journey?key=${encodeURIComponent(passkey)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("unauthorized")))
      .then((d) => setRows(d.journeys ?? []))
      .catch(() => setError("Wrong key or database asleep. Check ADMIN_KEY in .env"));
  }, [passkey]);

  if (error) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#07070d] px-6">
        <div className="rounded-xl border border-red-500/40 bg-black/60 p-8 text-center backdrop-blur-xl">
          <Search className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-red-200">{error}</p>
        </div>
      </main>
    );
  }

  if (!rows) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#07070d]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500/30 border-t-red-400" />
      </main>
    );
  }

  const said = rows.filter((r) => r.accepted).length;

  /* the last guide reply tells the tester which brain was live */
  const aiBadge = (r: JourneyRow) => {
    const lastGuide = [...r.transcript].reverse().find((m) => m.role === "guide");
    if (!lastGuide) return null;
    const live = lastGuide.source !== "offline";
    return (
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
          live
            ? "bg-emerald-500/15 text-emerald-300"
            : "bg-red-900/40 text-red-300"
        }`}
      >
        AI {live ? "LIVE" : "OFFLINE"}
      </span>
    );
  };

  return (
    <main className="min-h-[100dvh] bg-[#07070d] px-4 py-10 text-red-50">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-red-300/60">
          Mission Log · Eyes Only
        </p>
        <h1 className="mt-2 font-display text-2xl uppercase tracking-wide">
          The Web Mission — Records
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {rows.length} journey{rows.length === 1 ? "" : "s"} logged ·{" "}
          <span className="text-amber-300">{said} said YES</span>
        </p>
        <p className="mt-1.5 text-xs text-white/35">
          AI status is tagged on every reply — if the mission stalls and replies
          read OFFLINE, the AI satellite was unreachable (levels never progress
          while offline, by design).
        </p>

        {rows.length === 0 && (
          <div className="mt-10 rounded-xl border border-white/10 bg-black/50 p-8 text-center text-white/50">
            <Hourglass className="mx-auto mb-3 h-8 w-8 text-red-400/60" />
            No journeys yet. Send the link and wait for the magic…
          </div>
        )}

        <div className="mt-8 space-y-4">
          {rows.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl"
            >
              <button
                onClick={() => setOpen(open === r.id ? null : r.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                {r.accepted ? (
                  <Heart className="h-5 w-5 shrink-0 fill-red-500 text-red-500" />
                ) : (
                  <Fingerprint className="h-5 w-5 shrink-0 text-red-400/70" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    “{r.nameEntered || "—"}”
                    {r.nameMatched && (
                      <span className="ml-2 rounded bg-red-600/20 px-1.5 py-0.5 font-mono text-[10px] uppercase text-red-300">
                        matched: {r.nameMatched}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {STAGE_LABELS[r.stage] ?? r.stage} ·{" "}
                    {new Date(r.updatedAt).toLocaleString()}
                  </p>
                </div>
                {r.accepted && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    YES
                  </span>
                )}
                {aiBadge(r)}
              </button>
              {open === r.id && r.transcript.length > 0 && (
                <div className="max-h-96 space-y-2.5 overflow-y-auto border-t border-white/10 px-5 py-4">
                  {r.transcript.map((m, j) => (
                    <div
                      key={j}
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] ${
                        m.role === "guide"
                          ? "mr-auto bg-red-950/40 text-red-100"
                          : "ml-auto bg-red-900/40 text-red-50"
                      }`}
                    >
                      <span className="mr-1.5 font-mono text-[9px] uppercase tracking-wider text-white/35">
                        {m.role === "guide" ? "Guide" : "Guest"}
                      </span>
                      {m.role === "guide" && (
                        <span
                          className={`mr-1.5 rounded px-1 py-px font-mono text-[8px] uppercase tracking-wide ${
                            m.source === "offline"
                              ? "bg-red-900/60 text-red-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {m.source === "offline" ? "offline" : "live"}
                        </span>
                      )}
                      {m.content}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-white/25">
          with love, from the host
        </p>
      </div>
    </main>
  );
}
