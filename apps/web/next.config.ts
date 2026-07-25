import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@lotiva/ui", "@lotiva/design-tokens", "@lotiva/design-system"],
  trailingSlash: true,
};

export default nextConfig;
