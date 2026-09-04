import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
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
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
