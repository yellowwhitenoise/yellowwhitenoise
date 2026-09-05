import { amazonMusicMatch } from "./amazon";
import { appleAlbum, appleTrack } from "./apple";
import { spotifyAlbum, spotifyPlaylist, spotifyTrack } from "./spotify";
import { youtubePlaylist, youtubeTrack } from "./youtube";
import type { Platform } from "@/lib/data";
import {
  clearCachedByPrefix,
  getCachedJson,
  setCachedJson,
} from "@/lib/db";

export function clearCatalogCache(): number {
  cache.clear();
  return clearCachedByPrefix("catalog:");
}

export interface ResolvedCatalogEntry {
  matched: boolean;
  links: Partial<Record<Platform, string>>;
  previewUrl?: string;
  artworkUrl?: string;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;
const cache = new Map<
  string,
  { value: ResolvedCatalogEntry; expiresAt: number }
>();
const inflight = new Map<string, Promise<ResolvedCatalogEntry>>();

function merge(
  ...parts: (ResolvedCatalogEntry | null)[]
): ResolvedCatalogEntry {
  const links: Partial<Record<Platform, string>> = {};
  let previewUrl: string | undefined;
  let artworkUrl: string | undefined;
  for (const part of parts) {
    if (!part?.matched) continue;
    Object.assign(links, part.links);
    previewUrl ??= part.previewUrl;
    artworkUrl ??= part.artworkUrl;
  }
  return {
    matched: Object.keys(links).length > 0,
    links,
    previewUrl,
    artworkUrl,
  };
}

async function cached(
  key: string,
  loader: () => Promise<ResolvedCatalogEntry>,
): Promise<ResolvedCatalogEntry> {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value;
  const persisted = getCachedJson<ResolvedCatalogEntry>(`catalog:${key}`);
  if (persisted) {
    cache.set(key, { value: persisted, expiresAt: Date.now() + CACHE_TTL });
    return persisted;
  }
  const pending = inflight.get(key);
  if (pending) return pending;
  const request = (async () => {
    const value = await loader();
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
    try {
      setCachedJson(`catalog:${key}`, value, CACHE_TTL);
    } catch {
      // A cache write must never prevent a valid platform response.
    }
    return value;
  })();
  inflight.set(key, request);
  try {
    return await request;
  } finally {
    if (inflight.get(key) === request) inflight.delete(key);
  }
}

export function resolveTrack(
  title: string,
  artist: string,
): Promise<ResolvedCatalogEntry> {
  // v2 key: v1 entries predate Amazon Music resolution.
  return cached(`track:v2:${artist}:${title}`.toLowerCase(), async () => {
    const [spotify, apple, youtube] = await Promise.all([
      spotifyTrack(title, artist),
      appleTrack(title, artist),
      youtubeTrack(title, artist),
    ]);
    const base = merge(spotify, apple, youtube);
    const amazon = await amazonMusicMatch(
      spotify?.links.spotify ??
        apple?.links.appleMusic ??
        youtube?.links.youtubeMusic,
    );
    return merge(base, amazon);
  });
}

export function resolveAlbum(
  title: string,
  artist: string,
): Promise<ResolvedCatalogEntry> {
  // v2 key: v1 entries predate Amazon Music resolution.
  return cached(`album:v2:${artist}:${title}`.toLowerCase(), async () => {
    const [spotify, apple] = await Promise.all([
      spotifyAlbum(title, artist),
      appleAlbum(title, artist),
    ]);
    const base = merge(spotify, apple);
    const amazon = await amazonMusicMatch(
      spotify?.links.spotify ?? apple?.links.appleMusic,
    );
    return merge(base, amazon);
  });
}

export function resolvePlaylist(
  name: string,
  curator: string,
): Promise<ResolvedCatalogEntry> {
  return cached(`playlist:${curator}:${name}`.toLowerCase(), async () => {
    const [spotify, youtube] = await Promise.all([
      spotifyPlaylist(name, curator),
      youtubePlaylist(name, curator),
    ]);
    return merge(spotify, youtube);
  });
}
