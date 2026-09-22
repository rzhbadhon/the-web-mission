# Place static assets here.

This folder is intentionally empty. The Web Mission generates all textures
procedurally (see `src/components/invitation/scene3d/textures.ts`) — there are
no external image, audio, or model files.

Drop your own assets here (favicon, og-image, font files, custom GLB models)
and reference them via Next.js's standard `public/` URL.

Examples:
- `public/favicon.ico`           → `<link rel="icon" href="/favicon.ico" />`
- `public/og.png`                 → referenced from `app/layout.tsx`'s `metadata.openGraph.images`
- `public/fonts/MyDisplay.woff2`  → loaded via `@font-face` in `globals.css`
- `public/models/hero.glb`        → loaded via `useGLTF` from `@react-three/drei` if you swap the procedural Spidey for a real model
