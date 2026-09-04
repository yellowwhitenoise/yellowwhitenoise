import { create } from "zustand";
import type { Platform } from "@/lib/data";

export interface ResolvedLinks {
  matched: boolean;
  links: Partial<Record<Platform, string>>;
  previewUrl?: string;
  artworkUrl?: string;
}

interface CatalogState {
  resolved: Record<string, ResolvedLinks>;
  resolveTrack: (
    artistSlug: string,
    songSlug: string,
    title: string,
    artistName: string,
  ) => Promise<void>;
  resolveAlbum: (
    artistSlug: string,
    albumTitle: string,
    artistName: string,
  ) => Promise<void>;
}

const inflight = new Map<string, Promise<void>>();

export function trackKey(artistSlug: string, songSlug: string): string {
  return `track:${artistSlug}:${songSlug}`;
}

export function albumKey(artistSlug: string, albumTitle: string): string {
  return `album:${artistSlug}:${albumTitle}`;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  resolved: {},
  resolveTrack: async (artistSlug, songSlug, title, artistName) => {
    const key = trackKey(artistSlug, songSlug);
    if (get().resolved[key]) return;
    const existing = inflight.get(key);
    if (existing) return existing;
    const promise = (async () => {
      try {
        const query = new URLSearchParams({ title, artist: artistName });
        const response = await fetch(`/api/resolve/track?${query.toString()}`);
        if (!response.ok) return;
        const data = (await response.json()) as ResolvedLinks;
        set((state) => ({ resolved: { ...state.resolved, [key]: data } }));
      } catch {
        return;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, promise);
    return promise;
  },
  resolveAlbum: async (artistSlug, albumTitle, artistName) => {
    const key = albumKey(artistSlug, albumTitle);
    if (get().resolved[key]) return;
    const existing = inflight.get(key);
    if (existing) return existing;
    const promise = (async () => {
      try {
        const query = new URLSearchParams({ title: albumTitle, artist: artistName });
        const response = await fetch(`/api/resolve/album?${query.toString()}`);
        if (!response.ok) return;
        const data = (await response.json()) as ResolvedLinks;
        set((state) => ({ resolved: { ...state.resolved, [key]: data } }));
      } catch {
        return;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, promise);
    return promise;
  },
}));
