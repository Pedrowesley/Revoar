import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@revoar/shared"],
  ...(process.env.NODE_ENV === "production"
    ? {
        output: "standalone" as const,
        outputFileTracingRoot: path.join(__dirname, "../../"),
      }
    : {}),
};

export default nextConfig;
