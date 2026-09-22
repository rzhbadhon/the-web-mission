// ─────────────────────────────────────────────────────────────────────────────
// name-match.ts — forgiving name matcher for the gate.
//
// Most users will mistype their own name. This matcher:
//   1. normalises the input (lowercase, trim, strip accents, strip punctuation)
//   2. looks for an exact variant hit among the configured canonical names
//   3. falls back to Levenshtein-distance ≤ 2 ("close" — surfaces a softer
//      rejection message that hints at how near they are)
//
// Configure your accepted names in `config.ts` → GATE_NAMES.
// ─────────────────────────────────────────────────────────────────────────────

import { GATE_NAMES, type CanonicalName } from "./config";

export interface MatchResult {
  ok: boolean;
  canonical?: string;
  display?: string;
  close?: boolean;
}

/** Lowercase, trim, strip accents & punctuation — what the matcher sees. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance ≤ `max` — classic DP, no dependencies. */
function levenshtein(a: string, b: string, max: number): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > max) return max + 1;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1; // early-out — no point continuing
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Match an entered name against every canonical name's variants. */
export function matchName(entered: string): MatchResult {
  const e = normalise(entered);
  if (!e) return { ok: false };

  let best: { canonical: CanonicalName; dist: number } | null = null;

  for (const c of GATE_NAMES) {
    for (const v of c.variants) {
      const n = normalise(v);
      if (!n) continue;
      if (n === e) {
        return { ok: true, canonical: c.id, display: c.display };
      }
      const d = levenshtein(n, e, 2);
      if (d <= 2 && (!best || d < best.dist)) {
        best = { canonical: c, dist: d };
      }
    }
  }

  return best
    ? { ok: false, close: true } // near-miss — softer rejection
    : { ok: false };
}
