import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/artists/:slug", destination: "/:slug", permanent: true },
      { source: "/playlist", destination: "/playlists", permanent: true },
      ...(backendUrl
        ? [
            {
              source: "/admin",
              destination: `${backendUrl}/admin`,
              permanent: false,
            },
            {
              source: "/admin/:path*",
              destination: `${backendUrl}/admin/:path*`,
              permanent: false,
            },
          ]
        : []),
    ];
  },
  async rewrites() {
    if (!backendUrl) return [];
    // afterFiles: local routes (including /api/admin/*) always win; the
    // backend only serves paths this app does not own.
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
