import { getSetting } from "@/lib/db";

export const DEFAULT_PLAYLIST_SYNC_MINUTES = 15;
export const DEFAULT_ARTIST_SYNC_MINUTES = 6 * 60;

// Hard limits to guard against typos (e.g. an extra zero hammering APIs).
const MIN_MINUTES = 1;
const MAX_MINUTES = 7 * 24 * 60;

function parseMinutes(raw: string | null, fallback: number): number {
  const parsed = raw === null ? NaN : Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.floor(parsed)));
}

export function getPlaylistSyncMinutes(): number {
  return parseMinutes(
    getSetting("playlist_sync_interval_minutes"),
    DEFAULT_PLAYLIST_SYNC_MINUTES,
  );
}

export function getArtistSyncMinutes(): number {
  return parseMinutes(
    getSetting("artist_sync_interval_minutes"),
    DEFAULT_ARTIST_SYNC_MINUTES,
  );
}

export function getPlaylistSyncIntervalMs(): number {
  return getPlaylistSyncMinutes() * 60 * 1000;
}

export function getArtistSyncIntervalMs(): number {
  return getArtistSyncMinutes() * 60 * 1000;
}

export function getHapticsEnabled(): boolean {
  return getSetting("haptics_enabled") !== "false";
}

export type PlaylistStyle = "full" | "compact";

export function getPlaylistStyle(): PlaylistStyle {
  return getSetting("playlist_style") === "compact" ? "compact" : "full";
}
