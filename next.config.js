/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // transpile three.js & friends (ESM packages that need it)
  transpilePackages: ["three"],
  experimental: {
    // optimize three.js tree-shaking
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // voices come from the browser; LLM calls go through our own /api/agent
  // route, so no remote-domains config is needed by default.
};

module.exports = nextConfig;
