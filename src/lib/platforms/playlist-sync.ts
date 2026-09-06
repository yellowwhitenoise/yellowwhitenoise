import type { PlaylistInput, PlaylistRow } from "@/lib/db";
import {
  getPlaylistRowById,
  listPendingPlaylistTrackEvents,
  listPlaylistRows,
  markPlaylistSyncError,
  recordPlaylistTrackEvents,
  refreshImportedPlaylist,
} from "@/lib/db";
import { notifyPlaylistSubscribers } from "@/lib/mailer";
import type { PlaylistTrack } from "@/lib/data";
import { invalidatePublicPlaylists } from "@/lib/public-playlists";
import {
  DEFAULT_PLAYLIST_SYNC_MINUTES,
  getPlaylistSyncIntervalMs,
} from "@/lib/sync-settings";
import { importPlaylistFromUrl } from "./playlist-import";
import { getSpotifyUserAccessToken } from "./spotify-auth";

// Default refresh interval; the live value is configurable in Admin → Settings.
export const PLAYLIST_SYNC_INTERVAL_MS =
  DEFAULT_PLAYLIST_SYNC_MINUTES * 60 * 1000;

export interface PlaylistSyncReport {
  id: number;
  name: string;
  ok: boolean;
  error?: string;
  row?: PlaylistRow;
  addedTracks?: number;
  notifiedTracks?: number;
  notificationSkipped?: string;
}

let activeSync: Promise<PlaylistSyncReport[]> | null = null;

function playlistInputFromImport(
  imported: Awaited<ReturnType<typeof importPlaylistFromUrl>>,
  row: PlaylistRow,
): PlaylistInput {
  return {
    name: imported.name,
    tagline: row.tagline || `Curated on ${imported.platform}`,
    description: imported.description || row.description,
    coverUrl: imported.coverUrl ?? row.cover_url,
    coverPaletteFrom: row.cover_palette_from,
    coverPaletteTo: row.cover_palette_to,
    links: { [imported.platform]: imported.sourceUrl },
    entries: imported.tracks,
    sourcePlatform: imported.platform,
    sourceId: imported.sourceId,
    sourceUrl: imported.sourceUrl,
    visible: row.visible === 1,
    sortOrder: row.sort_order,
  };
}

function parsePlaylistTracks(raw: string): PlaylistTrack[] {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((track): track is PlaylistTrack => {
      if (typeof track !== "object" || track === null) return false;
      const candidate = track as Record<string, unknown>;
      return (
        typeof candidate.title === "string" &&
        typeof candidate.artistName === "string" &&
        typeof candidate.links === "object" &&
        candidate.links !== null
      );
    });
  } catch {
    return [];
  }
}

function normalizeKeyPart(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[‐‑‒–—―]/g, "-")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function trackKey(track: PlaylistTrack, platform: string): string {
  const sourceLink = track.links[platform as keyof typeof track.links];
  if (sourceLink && sourceLink.trim() !== "") {
    return `url:${sourceLink.trim().toLowerCase()}`;
  }
  return `meta:${normalizeKeyPart(track.title)}\u0000${normalizeKeyPart(track.artistName)}`;
}

async function syncRow(row: PlaylistRow): Promise<PlaylistSyncReport> {
  try {
    // A connected Spotify account can also refresh private playlists.
    const spotifyToken =
      row.source_platform === "spotify"
        ? await getSpotifyUserAccessToken().catch(() => null)
        : undefined;
    const imported = await importPlaylistFromUrl(row.source_url, {
      spotifyToken: spotifyToken ?? undefined,
    });
    const previousKeys = new Set(
      parsePlaylistTracks(row.entries).map((track) =>
        trackKey(track, imported.platform),
      ),
    );
    const addedTracks = imported.tracks.filter(
      (track) => !previousKeys.has(trackKey(track, imported.platform)),
    );
    recordPlaylistTrackEvents(
      addedTracks.map((track) => ({
        playlistSlug: row.slug,
        trackKey: trackKey(track, imported.platform),
        title: track.title,
        artistName: track.artistName,
        trackUrl: track.links[imported.platform],
      })),
    );
    const input = playlistInputFromImport(imported, row);
    const updated = refreshImportedPlaylist(row.id, input);
    if (!updated) {
      return { id: row.id, name: row.name, ok: false, error: "Playlist not found." };
    }
    const pendingEvents = listPendingPlaylistTrackEvents(row.slug);
    let notifiedTracks = 0;
    let notificationSkipped: string | undefined;
    if (pendingEvents.length > 0) {
      const notification = await notifyPlaylistSubscribers(
        row.slug,
        updated.name,
        pendingEvents,
        {
          coverUrl: input.coverUrl ?? undefined,
          platformLinks: input.links,
        },
      );
      notificationSkipped = notification.skipped;
      if (
        !notification.skipped &&
        notification.sent === notification.total
      ) {
        notifiedTracks = pendingEvents.length;
      }
    }
    try {
      invalidatePublicPlaylists();
    } catch {
      // Cache invalidation is best effort; the short TTL is still safe.
    }
    return {
      id: row.id,
      name: updated.name,
      ok: true,
      row: updated,
      addedTracks: addedTracks.length,
      notifiedTracks,
      notificationSkipped,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Playlist sync failed.";
    markPlaylistSyncError(row.id, message);
    return { id: row.id, name: row.name, ok: false, error: message };
  }
}

async function syncRows(rows: PlaylistRow[]): Promise<PlaylistSyncReport[]> {
  const reports: PlaylistSyncReport[] = [];
  for (const row of rows) {
    reports.push(await syncRow(row));
  }
  return reports;
}

function runWithLock(rows: PlaylistRow[]): Promise<PlaylistSyncReport[]> {
  if (activeSync) return activeSync;
  activeSync = syncRows(rows).finally(() => {
    activeSync = null;
  });
  return activeSync;
}

export function syncAllPlaylists(): Promise<PlaylistSyncReport[]> {
  return runWithLock(listPlaylistRows().filter((row) => row.source_url));
}

export async function syncPlaylistById(
  id: number,
): Promise<PlaylistSyncReport | undefined> {
  const row = getPlaylistRowById(id);
  if (!row) return undefined;
  // Never hand back another scope's report: a per-playlist sync requested
  // while a bulk sync runs gets an explicit busy error instead.
  if (activeSync) {
    return {
      id: row.id,
      name: row.name,
      ok: false,
      error: "Sync already in progress. Try again shortly.",
    };
  }
  const reports = await runWithLock([row]);
  return reports[0];
}

function isStale(row: PlaylistRow, now: number): boolean {
  const lastAttempt = row.last_sync_attempt_at ?? row.last_synced_at;
  if (!lastAttempt) return true;
  const normalized = lastAttempt.includes("T")
    ? lastAttempt
    : `${lastAttempt.replace(" ", "T")}Z`;
  const timestamp = Date.parse(normalized);
  return (
    Number.isNaN(timestamp) || now - timestamp >= getPlaylistSyncIntervalMs()
  );
}

export function syncStalePlaylists(): Promise<PlaylistSyncReport[]> {
  const now = Date.now();
  const rows = listPlaylistRows().filter(
    (row) => row.source_url && isStale(row, now),
  );
  return runWithLock(rows);
}
