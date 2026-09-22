// ─────────────────────────────────────────────────────────────────────────────
// app/layout.tsx — the Next.js App Router root.
//
// Sets up Tailwind, the global CSS (with the wm-* animation keyframes the
// invitation components use), and a respectful title.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Web Mission",
  description:
    "A voice-driven, 3D, AI-powered invitation experience. Open-source template for a single-person, multi-stage cinematic web journey.",
  applicationName: "The Web Mission",
  authors: [{ name: "Open-source contributors" }],
  keywords: [
    "invitation",
    "voice",
    "web-speech-api",
    "three.js",
    "next.js",
    "spider-man",
    "ai",
    "template",
  ],
  openGraph: {
    title: "The Web Mission",
    description:
      "A voice-driven, 3D, AI-powered invitation experience — open-source template.",
    type: "website",
  },
  robots: { index: false, follow: false }, // personal invitation — don't index
};

export const viewport: Viewport = {
  themeColor: "#07070d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // mobile pinch-zoom fights the 3D camera rig
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-[100dvh] bg-[#07070d] font-sans text-red-50 antialiased">
        {children}
      </body>
    </html>
  );
}
