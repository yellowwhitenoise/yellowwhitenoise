import { ImageResponse } from "next/og";
import type { Playlist } from "@/lib/data";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";
import { getCachedPublicPlaylist } from "@/lib/public-playlists";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const playlist = isBackendConfigured()
    ? await fetchBackendJson<Playlist>(
        `/api/public/playlists/${encodeURIComponent(slug)}`,
      )
    : await getCachedPublicPlaylist(slug);

  if (!playlist) {
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: 14,
              color: "#f0b429",
              textTransform: "uppercase",
            }}
          >
            PLAYLIST
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 92,
              fontWeight: 700,
              color: "#f5f1e8",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {playlist.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 40,
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
            height: 320,
            borderRadius: 28,
            backgroundColor: playlist.coverPalette.from,
            color: "rgba(255,255,255,0.25)",
            fontSize: 180,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {playlist.name[0]}
        </div>
      </div>
    ),
    size,
  );
}
