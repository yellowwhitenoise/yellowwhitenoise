import type { Metadata } from "next";
import { getSetting } from "@/lib/db";
import { PlaylistListClient } from "@/components/PlaylistListClient";
import type { MediaRef, Playlist } from "@/lib/data";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";
import { getCachedPublicPlaylists } from "@/lib/public-playlists";
import { syncStalePlaylists } from "@/lib/platforms/playlist-sync";
import { getTapHidePlaylistEnabled } from "@/lib/sync-settings";

export const metadata: Metadata = {
  title: "Playlists",
  description:
    "Curated Yellow White Noise playlists — label tracks and hand-picked selections, streaming on all platforms.",
  alternates: { canonical: "/playlists" },
  openGraph: { url: "/playlists", title: "Playlists" },
};

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  if (isBackendConfigured()) {
    const data = await fetchBackendJson<{
      playlists: Playlist[];
      backdrop: MediaRef | null;
    }>("/api/public/playlists");
    return (
      <PlaylistListClient
        playlists={data?.playlists ?? []}
        backdrop={data?.backdrop ?? undefined}
        tapHideEnabled
      />
    );
  }
  // Background refresh only — render serves the cache immediately.
  void syncStalePlaylists().catch(() => {});
  const playlists = await getCachedPublicPlaylists();
  let backdrop: MediaRef | undefined;
  const raw = getSetting("home_backdrop");
  if (raw) {
    try {
      backdrop = JSON.parse(raw) as MediaRef;
    } catch {
      backdrop = undefined;
    }
  }
  return (
    <PlaylistListClient
      playlists={playlists}
      backdrop={backdrop}
      tapHideEnabled={getTapHidePlaylistEnabled()}
    />
  );
}
