import { ImageResponse } from "next/og";
import type { Artist } from "@/lib/data";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";
import { getArtistBySlug } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = isBackendConfigured()
    ? (
        await fetchBackendJson<{ artists: Artist[] }>("/api/public/home")
      )?.artists.find((entry) => entry.slug === slug) ?? undefined
    : getArtistBySlug(slug);

  if (!artist) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#14120d",
            color: "#f5f1e8",
            fontSize: 64,
          }}
        >
          Yellow White Noise
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#14120d",
          padding: "0 96px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 700,
              color: "#f5f1e8",
              letterSpacing: 8,
              textTransform: "uppercase",
            }}
          >
            {artist.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 32,
              letterSpacing: 14,
              color: "#f0b429",
              textTransform: "uppercase",
            }}
          >
            {artist.genre}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 48,
              fontSize: 26,
              letterSpacing: 6,
              color: "rgba(245,241,232,0.55)",
            }}
          >
            YELLOW WHITE NOISE
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: 320,
            height: 400,
            borderRadius: 24,
            backgroundColor: artist.palette.from,
            color: "rgba(255,255,255,0.25)",
            fontSize: 220,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {artist.name[0]}
        </div>
      </div>
    ),
    size,
  );
}
