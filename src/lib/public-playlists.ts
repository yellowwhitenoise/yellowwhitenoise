import { revalidateTag, unstable_cache } from "next/cache";
import { listPublicPlaylists } from "@/lib/db";
import type { Playlist } from "@/lib/data";

export const PUBLIC_PLAYLISTS_CACHE_TAG = "public-playlists";

const loadPublicPlaylists = unstable_cache(
  async (): Promise<Playlist[]> => listPublicPlaylists(),
  ["public-playlists-v1"],
  { revalidate: 60, tags: [PUBLIC_PLAYLISTS_CACHE_TAG] },
);

export function getCachedPublicPlaylists(): Promise<Playlist[]> {
  return loadPublicPlaylists();
}

export async function getCachedPublicPlaylist(
  slug: string,
): Promise<Playlist | undefined> {
  const playlists = await loadPublicPlaylists();
  return playlists.find((playlist) => playlist.slug === slug);
}

export function invalidatePublicPlaylists() {
  revalidateTag(PUBLIC_PLAYLISTS_CACHE_TAG, "max");
}
