import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images are served as <img srcset> straight from Sanity's image CDN
  // (auto WebP/AVIF, focal-point crops) — the Next image optimizer isn't used.

  async redirects() {
    return [
      // Legacy WordPress tag archive → the wedding portfolio.
      {
        source: "/tag/sonoma-county-wedding-photographer",
        destination: "/weddings",
        permanent: true,
      },
      { source: "/tag/:tag", destination: "/blog", permanent: true },
      // Legacy WordPress internals that should never 404.
      { source: "/wp-content/:path*", destination: "/", permanent: true },
      { source: "/wp-admin/:path*", destination: "/studio", permanent: false },
      // Old duplicate-slug variants seen in the wild (WordPress "-2" suffixes
      // are preserved as-is by the CMS; nothing to map here).
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
