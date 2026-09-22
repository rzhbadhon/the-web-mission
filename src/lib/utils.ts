// ─────────────────────────────────────────────────────────────────────────────
// lib/utils.ts — shadcn/ui utility (cn) helper.
// Used by every component in `src/components/ui/` to merge Tailwind classes.
// ─────────────────────────────────────────────────────────────────────────────

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
