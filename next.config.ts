import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The current Hito 0 prototype uses prerendered routes and client-side demo data.
  // Revisit this setting before adding Next.js server routes or SSR features.
  output: "export",
};

export default nextConfig;
