import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local browser tests use IPv4 loopback instead of the default localhost host.
  allowedDevOrigins: ["127.0.0.1"],
  // Preserve the repository's own AGENTS.md rather than generating extra rules.
  agentRules: false,
};

export default nextConfig;
