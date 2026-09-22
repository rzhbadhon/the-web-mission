"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TicketCard — the grand finale: the guest's cinema ticket, issued by the web itself.
// ─────────────────────────────────────────────────────────────────────────────

import { motion } from "framer-motion";
import { Ticket, CalendarDays, Clock, MapPin, Armchair, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOVIE, HIM } from "@/lib/invitation/config";

interface TicketCardProps {
  displayName: string;
  onRestart: () => void;
}

export function TicketCard({ displayName, onRestart }: TicketCardProps) {
  const fields = [
    { icon: CalendarDays, label: "Date", value: MOVIE.date },
    { icon: Clock, label: "Time", value: MOVIE.time },
    { icon: MapPin, label: "Cinema", value: MOVIE.place },
    { icon: Armchair, label: "Seats", value: MOVIE.seat },
  ];

  return (
    <motion.section
      key="ticket"
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.35 } }}
      transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.5 }}
      className="relative z-20 mx-auto w-full max-w-md px-5"
      aria-label="Your movie ticket"
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-300/40 bg-gradient-to-b from-[#14060a] to-black shadow-[0_0_70px_-10px_rgba(255,180,60,0.35)]">
        {/* faint web watermark */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 opacity-[0.13]"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, transparent 38px, #ffd166 39px, transparent 41px), radial-gradient(circle at center, transparent 78px, #ffd166 79px, transparent 81px), radial-gradient(circle at center, transparent 118px, #ffd166 119px, transparent 121px)",
          }}
        />
        <div className="relative px-6 pb-6 pt-7 sm:px-8">
          {/* header */}
          <div className="flex items-center justify-between">
            <span className="rounded bg-red-600 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.25em] text-white">
              Admit Two
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/80">
              <Ticket className="h-3.5 w-3.5" />
              Web-Mission Pass · No. 001
            </span>
          </div>

          <h2 className="mt-5 font-display text-xl uppercase leading-tight tracking-wide text-amber-100">
            {MOVIE.title}
          </h2>
          <p className="mt-1 text-[13px] text-amber-200/70">
            Guest of honour: {displayName} — with {HIM.name}
          </p>

          {/* perforated divider */}
          <div className="my-5 flex items-center gap-2" aria-hidden="true">
            <span className="h-4 w-4 -translate-x-7 rounded-full bg-[#07070d]" />
            <span className="flex-1 border-t border-dashed border-amber-200/30" />
            <span className="h-4 w-4 translate-x-7 rounded-full bg-[#07070d]" />
          </div>

          {/* details */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                    {f.label}
                  </p>
                  <p className="text-[13px] font-medium leading-snug break-words text-amber-50">
                    {f.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* barcode */}
          <div className="mt-5 flex h-10 items-stretch justify-center gap-[3px] opacity-80" aria-hidden="true">
            {Array.from({ length: 42 }).map((_, i) => (
              <span
                key={i}
                className="w-[2px] bg-amber-100"
                style={{ opacity: (i * 7919) % 5 === 0 ? 0.15 : 0.55 + ((i * 13) % 3) * 0.15 }}
              />
            ))}
          </div>

          <p className="mt-4 text-center text-[13px] italic leading-relaxed text-amber-100/80">
            "Some people walk into the darkness of a cinema
            <br />
            and come back glowing — tonight, that light sits beside you."
          </p>
          <p className="mt-1.5 text-center font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
            with love, {HIM.name}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 pb-10">
        <Button
          onClick={onRestart}
          variant="ghost"
          className="gap-2 text-[13px] text-white/50 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Relive the mission
        </Button>
        <p className="text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">
          Screenshot this · The web keeps no copies
        </p>
      </div>
    </motion.section>
  );
}
