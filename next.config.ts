import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes disabled while we rely on string literals in redirect()/Link.
  // Re-enable once we adopt the generated Route type or Pathnames helper.
  typedRoutes: false,
};

export default nextConfig;
