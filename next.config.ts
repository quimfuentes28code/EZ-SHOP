import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hito 0 runs entirely in the browser; static export keeps Cloudflare deployment simple.
  // Revisit this before adding SSR, API routes, or other server-side functionality.
  output: "export",
  allowedDevOrigins: ["127.0.0.1"],
  agentRules: false,
};

export default nextConfig;
