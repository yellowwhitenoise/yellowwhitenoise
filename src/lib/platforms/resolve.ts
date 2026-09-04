import { appleAlbum, appleTrack } from "./apple";
import { spotifyAlbum, spotifyPlaylist, spotifyTrack } from "./spotify";
import { youtubePlaylist, youtubeTrack } from "./youtube";
import type { Platform } from "@/lib/data";
import { getCachedJson, setCachedJson } from "@/lib/db";

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
  return cached(`track:${artist}:${title}`.toLowerCase(), async () => {
    const [spotify, apple, youtube] = await Promise.all([
      spotifyTrack(title, artist),
      appleTrack(title, artist),
      youtubeTrack(title, artist),
    ]);
    return merge(spotify, apple, youtube);
  });
}

export function resolveAlbum(
  title: string,
  artist: string,
): Promise<ResolvedCatalogEntry> {
  return cached(`album:${artist}:${title}`.toLowerCase(), async () => {
    const [spotify, apple] = await Promise.all([
      spotifyAlbum(title, artist),
      appleAlbum(title, artist),
    ]);
    return merge(spotify, apple);
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
