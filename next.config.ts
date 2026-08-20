import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // typedRoutes disabled while we rely on string literals in redirect()/Link.
  // Re-enable once we adopt the generated Route type or Pathnames helper.
  typedRoutes: false,
  experimental: {
    // Product Studio accepts up to four tightly validated reference photos.
    // Each file is capped server-side at 8 MiB.
    serverActions: { bodySizeLimit: "34mb" },
  },
};

export default nextConfig;
