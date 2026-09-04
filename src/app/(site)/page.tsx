import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { getSetting, listArtists } from "@/lib/db";
import type { Artist, MediaRef } from "@/lib/data";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";
import { syncStaleArtists } from "@/lib/platforms/artist-sync";
import { getTapHideEnabled } from "@/lib/sync-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Yellow White Noise — Independent Amapiano & Afrobeats Label",
  },
  description:
    "Yellow White Noise is an independent label home for Muddledsea (Amapiano) and Coaltonic (Afrobeats) — stream tracks, albums and curated playlists.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  if (isBackendConfigured()) {
    const data = await fetchBackendJson<{
      artists: Artist[];
      backdrop: MediaRef | null;
    }>("/api/public/home");
  return (
    <HomeClient
      artists={data?.artists ?? []}
      backdrop={data?.backdrop ?? undefined}
      tapHideEnabled
    />
  );
}
  await syncStaleArtists();
  const artists = listArtists();
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
    <HomeClient
      artists={artists}
      backdrop={backdrop}
      tapHideEnabled={getTapHideEnabled()}
    />
  );
}
