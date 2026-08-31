import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables a self-contained .next/standalone output — required for the
  // Dockerfile. Harmless on Vercel (Vercel ignores it).
  output: "standalone",
};

export default nextConfig;
