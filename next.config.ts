import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure content/test.md is bundled into the /test/[token] serverless function.
  // Dynamic readFile() paths aren't auto-traced, so we declare them explicitly.
  outputFileTracingIncludes: {
    "/test/[token]": ["./content/**"],
  },
};

export default nextConfig;
