import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is only needed for Docker deployments.
  // On Vercel, omit it — Vercel uses its own build output format.
  ...(process.env.DOCKER_BUILD ? { output: "standalone" as const } : {}),
};

export default nextConfig;
