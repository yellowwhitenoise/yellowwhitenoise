import type {
  Album,
  Artist,
  Platform,
  Song,
} from "@/lib/data";
import {
  getArtistById,
  listPendingArtistReleaseEvents,
  listSyncableArtists,
  markArtistReleaseEventsNotified,
  markArtistSyncError,
  recordArtistReleaseEvents,
  updateArtistCatalog,
} from "@/lib/db";
import {
  notifyArtistReleaseEvent,
} from "@/lib/mailer";
import { importArtistCatalog } from "./artist-import";
import type {
  ImportedArtistAlbum,
  ImportedArtistCatalog,
  ImportedArtistSong,
} from "./artist-types";

export const ARTIST_SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface ArtistSyncReport {
  id: number;
  slug: string;
  name: string;
  ok: boolean;
  error?: string;
  row?: Artist & { id: number };
  addedSongs?: number;
  addedAlbums?: number;
  notifiedReleases?: number;
  notificationSkipped?: string;
  failedPlatforms?: Platform[];
}

let activeSync: Promise<ArtistSyncReport[]> | null = null;

function normalize(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function idsMatch(
  left: Partial<Record<Platform, string>> | undefined,
  right: Partial<Record<Platform, string>> | undefined,
): boolean {
  if (!left || !right) return false;
  for (const platform of ["spotify", "appleMusic", "youtubeMusic"] as Platform[]) {
    if (left[platform] && left[platform] === right[platform]) return true;
  }
  return false;
}

function sameSong(left: Song, right: ImportedArtistSong): boolean {
  if (left.isrc && right.isrc && normalize(left.isrc) === normalize(right.isrc)) {
    return true;
  }
  if (idsMatch(left.platformIds, right.platformIds)) return true;
  return (
    normalize(left.title) === normalize(right.title) &&
    normalize(left.artistName) === normalize(right.artistName) &&
    normalize(left.album) === normalize(right.album)
  );
}

function sameAlbum(left: Album, right: ImportedArtistAlbum): boolean {
  if (left.isrc && right.isrc && normalize(left.isrc) === normalize(right.isrc)) {
    return true;
  }
  if (idsMatch(left.platformIds, right.platformIds)) return true;
  return normalize(left.title) === normalize(right.title);
}

function songSlug(title: string, songs: Song[]): string {
  const base = normalize(title).replace(/\s+/g, "-") || "track";
  let result = base;
  let suffix = 2;
  while (songs.some((song) => song.slug === result)) {
    result = `${base}-${suffix}`;
    suffix += 1;
  }
  return result;
}

function asSong(incoming: ImportedArtistSong, existing: Song[]): Song {
  return {
    slug: songSlug(incoming.title, existing),
    title: incoming.title,
    artistName: incoming.artistName,
    releaseYear: incoming.releaseYear,
    type: incoming.type,
    album: incoming.album,
    coverUrl: incoming.coverUrl,
    links: {
      spotify: incoming.links.spotify ?? "https://open.spotify.com/",
      appleMusic: incoming.links.appleMusic ?? "https://music.apple.com/",
      youtubeMusic:
        incoming.links.youtubeMusic ?? "https://music.youtube.com/",
    },
    previewUrl: incoming.previewUrl,
    isrc: incoming.isrc,
    platformIds: incoming.platformIds,
  };
}

function mergeSong(existing: Song, incoming: ImportedArtistSong): Song {
  return {
    ...existing,
    title: incoming.title || existing.title,
    artistName: incoming.artistName || existing.artistName,
    releaseYear: incoming.releaseYear || existing.releaseYear,
    type: incoming.type || existing.type,
    album: incoming.album ?? existing.album,
    coverUrl: incoming.coverUrl ?? existing.coverUrl,
    previewUrl: incoming.previewUrl ?? existing.previewUrl,
    isrc: existing.isrc ?? incoming.isrc,
    platformIds: { ...existing.platformIds, ...incoming.platformIds },
    links: { ...existing.links, ...incoming.links },
  };
}

function asAlbum(incoming: ImportedArtistAlbum): Album {
  return {
    title: incoming.title,
    links: {
      spotify: incoming.links.spotify ?? "https://open.spotify.com/",
      appleMusic: incoming.links.appleMusic ?? "https://music.apple.com/",
      youtubeMusic:
        incoming.links.youtubeMusic ?? "https://music.youtube.com/",
    },
    isrc: incoming.isrc,
    platformIds: incoming.platformIds,
  };
}

function mergeAlbum(existing: Album, incoming: ImportedArtistAlbum): Album {
  return {
    ...existing,
    title: incoming.title || existing.title,
    isrc: existing.isrc ?? incoming.isrc,
    platformIds: { ...existing.platformIds, ...incoming.platformIds },
    links: { ...existing.links, ...incoming.links },
  };
}

function flattenCatalogs(
  catalogs: { catalog: ImportedArtistCatalog }[],
): { albums: ImportedArtistAlbum[]; songs: ImportedArtistSong[] } {
  return {
    albums: catalogs.flatMap((source) => source.catalog.albums),
    songs: catalogs.flatMap((source) => source.catalog.songs),
  };
}

function releaseKey(
  release: ImportedArtistSong | ImportedArtistAlbum,
  type: "song" | "album",
): string {
  if (release.isrc) return `${type}:isrc:${normalize(release.isrc)}`;
  const ids = Object.entries(release.platformIds ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([platform, id]) => `${platform}:${id}`)
    .join("|");
  if (ids) return `${type}:ids:${ids.toLowerCase()}`;
  const song = release as ImportedArtistSong;
  return `${type}:meta:${normalize(release.title)}:${normalize(song.artistName)}:${normalize(song.album)}`;
}

function newSongCandidates(
  existing: Song[],
  incoming: ImportedArtistSong[],
): ImportedArtistSong[] {
  const known = [...existing];
  const fresh: ImportedArtistSong[] = [];
  for (const song of incoming) {
    if (known.some((candidate) => sameSong(candidate, song))) continue;
    fresh.push(song);
    known.push(asSong(song, known));
  }
  return fresh;
}

function newAlbumCandidates(
  existing: Album[],
  incoming: ImportedArtistAlbum[],
): ImportedArtistAlbum[] {
  const known = [...existing];
  const fresh: ImportedArtistAlbum[] = [];
  for (const album of incoming) {
    if (known.some((candidate) => sameAlbum(candidate, album))) continue;
    fresh.push(album);
    known.push(asAlbum(album));
  }
  return fresh;
}

function mergeCatalog(
  artist: Artist & { id: number },
  catalogs: { catalog: ImportedArtistCatalog }[],
): {
  albums: Album[];
  songs: Song[];
  newAlbums: ImportedArtistAlbum[];
  newSongs: ImportedArtistSong[];
} {
  const incoming = flattenCatalogs(catalogs);
  const newAlbums = newAlbumCandidates(artist.albums, incoming.albums);
  const newSongs = newSongCandidates(artist.songs, incoming.songs);
  const albums = [...artist.albums];
  for (const album of incoming.albums) {
    const index = albums.findIndex((candidate) => sameAlbum(candidate, album));
    if (index === -1) albums.push(asAlbum(album));
    else albums[index] = mergeAlbum(albums[index], album);
  }
  const songs = [...artist.songs];
  for (const song of incoming.songs) {
    const index = songs.findIndex((candidate) => sameSong(candidate, song));
    if (index === -1) songs.push(asSong(song, songs));
    else songs[index] = mergeSong(songs[index], song);
  }
  return { albums, songs, newAlbums, newSongs };
}

async function syncRow(artist: Artist & { id: number }): Promise<ArtistSyncReport> {
  try {
    const imported = await importArtistCatalog(
      artist.name,
      artist.syncSources ?? {},
    );
    const merged = mergeCatalog(artist, imported.catalogs);
    const events = [
      ...merged.newAlbums.map((album) => ({
        artistSlug: artist.slug,
        releaseKey: releaseKey(album, "album"),
        releaseType: "album" as const,
        title: album.title,
        artistName: artist.name,
        releaseUrl:
          album.links.spotify ||
          album.links.appleMusic ||
          album.links.youtubeMusic,
      })),
      ...merged.newSongs.map((song) => ({
        artistSlug: artist.slug,
        releaseKey: releaseKey(song, "song"),
        releaseType: "song" as const,
        title: song.title,
        artistName: song.artistName || artist.name,
        albumName: song.album,
        releaseUrl:
          song.links.spotify ||
          song.links.appleMusic ||
          song.links.youtubeMusic,
      })),
    ];
    recordArtistReleaseEvents(events);
    const updated = updateArtistCatalog(artist.id, merged.albums, merged.songs);
    if (!updated) {
      return {
        id: artist.id,
        slug: artist.slug,
        name: artist.name,
        ok: false,
        error: "Artist not found.",
      };
    }
    const pending = listPendingArtistReleaseEvents(artist.slug);
    let notifiedReleases = 0;
    let notificationSkipped: string | undefined;
    for (const event of pending) {
      const result = await notifyArtistReleaseEvent(artist.slug, event);
      notificationSkipped = result.skipped;
      if (!result.skipped && (result.sent > 0 || result.total === 0)) {
        markArtistReleaseEventsNotified([event]);
        notifiedReleases += 1;
      }
    }
    return {
      id: artist.id,
      slug: artist.slug,
      name: updated.name,
      ok: true,
      row: updated,
      addedSongs: merged.newSongs.length,
      addedAlbums: merged.newAlbums.length,
      notifiedReleases,
      notificationSkipped,
      failedPlatforms: imported.failed,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Artist sync failed.";
    markArtistSyncError(artist.id, message);
    return {
      id: artist.id,
      slug: artist.slug,
      name: artist.name,
      ok: false,
      error: message,
    };
  }
}

async function syncRows(
  artists: (Artist & { id: number })[],
): Promise<ArtistSyncReport[]> {
  const reports: ArtistSyncReport[] = [];
  for (const artist of artists) reports.push(await syncRow(artist));
  return reports;
}

function runWithLock(
  artists: (Artist & { id: number })[],
): Promise<ArtistSyncReport[]> {
  if (activeSync) return activeSync;
  activeSync = syncRows(artists).finally(() => {
    activeSync = null;
  });
  return activeSync;
}

export function syncAllArtists(): Promise<ArtistSyncReport[]> {
  return runWithLock(listSyncableArtists());
}

export async function syncArtistById(
  id: number,
): Promise<ArtistSyncReport | undefined> {
  const artist = getArtistById(id);
  if (!artist) return undefined;
  const reports = await runWithLock([artist]);
  return reports[0];
}

function isStale(artist: Artist & { id: number }, now: number): boolean {
  const lastAttempt = artist.lastSyncAttemptAt ?? artist.lastSyncedAt;
  if (!lastAttempt) return true;
  const normalized = lastAttempt.includes("T")
    ? lastAttempt
    : `${lastAttempt.replace(" ", "T")}Z`;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) || now - timestamp >= ARTIST_SYNC_INTERVAL_MS;
}

export function syncStaleArtists(): Promise<ArtistSyncReport[]> {
  const now = Date.now();
  return runWithLock(
    listSyncableArtists().filter((artist) => isStale(artist, now)),
  );
}
