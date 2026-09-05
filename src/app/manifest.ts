import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Yellow White Noise",
    short_name: "YWN",
    description:
      "Independent label home for Muddledsea (Amapiano) and Coaltonic (Afrobeats) — tracks, albums and curated playlists.",
    start_url: "/",
    display: "standalone",
    background_color: "#14120d",
    theme_color: "#14120d",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
