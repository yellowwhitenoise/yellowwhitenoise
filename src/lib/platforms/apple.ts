import { createSign } from "node:crypto";
import type { ResolvedEntity } from "./types";
import { isPlausibleMatch } from "./types";
import type { ImportedPlaylist } from "./playlist-types";
import type { ImportedArtistCatalog } from "./artist-types";

interface ITunesResult {
  trackName?: string;
  collectionName?: string;
  artistName: string;
  previewUrl?: string;
  trackViewUrl?: string;
  collectionViewUrl?: string;
  artworkUrl100?: string;
}

interface ApplePlaylistAttributes {
  name: string;
  description?: { standard?: string };
  artwork?: { url?: string };
  url?: string;
}

interface AppleTrackAttributes {
  name: string;
  artistName: string;
  albumName?: string;
  url?: string;
  artwork?: { url?: string };
  durationInMillis?: number;
  previews?: { url: string }[];
  isrc?: string;
}

interface AppleTrackResource {
  id: string;
  type: string;
  attributes?: AppleTrackAttributes;
}

interface ApplePlaylistResource {
  id: string;
  type: string;
  attributes?: ApplePlaylistAttributes;
  relationships?: {
    tracks?: {
      data?: AppleTrackResource[];
      next?: string;
    };
  };
}

interface ApplePlaylistResponse {
  data?: ApplePlaylistResource[];
}

interface AppleTracksResponse {
  data?: AppleTrackResource[];
  next?: string;
}

interface AppleArtistAlbumAttributes {
  name: string;
  artistName?: string;
  releaseDate?: string;
  url?: string;
  artwork?: { url?: string };
}

interface AppleArtistAlbumResource {
  id: string;
  type: string;
  attributes?: AppleArtistAlbumAttributes;
}

interface AppleArtistAlbumsResponse {
  data?: AppleArtistAlbumResource[];
  next?: string;
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function appleDeveloperToken(): string | null {
  const configured = process.env.APPLE_MUSIC_DEVELOPER_TOKEN;
  if (configured) return configured;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!teamId || !keyId || !privateKey) return null;
  const header = base64Url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(
    JSON.stringify({ iss: teamId, iat: now, exp: now + 60 * 60 }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer
    .sign({ key: privateKey, dsaEncoding: "ieee-p1363" })
    .toString("base64url");
  return `${unsigned}.${signature}`;
}

async function itunesSearch(
  params: Record<string, string>,
): Promise<ITunesResult | null> {
  const query = new URLSearchParams({
    country: "US",
    media: "music",
    limit: "3",
    ...params,
  });
  const response = await fetch(
    `https://itunes.apple.com/search?${query.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as { results?: ITunesResult[] };
  return data.results?.[0] ?? null;
}

function upscaleArtwork(url: string | undefined): string | undefined {
  return url?.replace("100x100", "600x600");
}

export async function appleTrack(
  title: string,
  artist: string,
): Promise<ResolvedEntity | null> {
  try {
    const result = await itunesSearch({
      term: `${title} ${artist}`,
      entity: "song",
    });
    if (!result?.trackViewUrl) return null;
    if (!isPlausibleMatch(`${result.trackName ?? ""} ${result.artistName}`, title))
      return null;
    if (!isPlausibleMatch(result.artistName, artist)) return null;
    return {
      matched: true,
      links: { appleMusic: result.trackViewUrl },
      previewUrl: result.previewUrl,
      artworkUrl: upscaleArtwork(result.artworkUrl100),
    };
  } catch {
    return null;
  }
}

export async function appleAlbum(
  title: string,
  artist: string,
): Promise<ResolvedEntity | null> {
  try {
    const result = await itunesSearch({
      term: `${title} ${artist}`,
      entity: "album",
    });
    if (!result?.collectionViewUrl) return null;
    if (!isPlausibleMatch(result.collectionName ?? "", title)) return null;
    if (!isPlausibleMatch(result.artistName, artist)) return null;
    return {
      matched: true,
      links: { appleMusic: result.collectionViewUrl },
      artworkUrl: upscaleArtwork(result.artworkUrl100),
    };
  } catch {
    return null;
  }
}

function appleArtwork(url: string | undefined): string | undefined {
  return url
    ?.replace("{w}", "600")
    .replace("{h}", "600")
    .replace("{f}", "jpg");
}

function absoluteAppleUrl(url: string, storefront: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/v1/")) return `https://api.music.apple.com${url}`;
  return `https://api.music.apple.com/v1/catalog/${storefront}${url}`;
}

export async function fetchApplePlaylist(
  playlistId: string,
  storefront: string,
): Promise<ImportedPlaylist | null> {
  try {
    const token = appleDeveloperToken();
    if (!token) return null;
    const headers = { Authorization: `Bearer ${token}` };
    const base = `https://api.music.apple.com/v1/catalog/${encodeURIComponent(storefront)}/playlists/${encodeURIComponent(playlistId)}`;
    const response = await fetch(`${base}?include=tracks&limit=100`, {
      headers,
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as ApplePlaylistResponse;
    const playlist = data.data?.[0];
    if (!playlist?.attributes) return null;
    const items = [...(playlist.relationships?.tracks?.data ?? [])];
    let next = playlist.relationships?.tracks?.next;
    while (next && items.length < 500) {
      const pageResponse = await fetch(absoluteAppleUrl(next, storefront), {
        headers,
        cache: "no-store",
      });
      if (!pageResponse.ok) break;
      const page = (await pageResponse.json()) as AppleTracksResponse;
      items.push(...(page.data ?? []));
      next = page.next;
    }
    const tracks = items
      .map((item) => item.attributes)
      .filter(
        (attributes): attributes is AppleTrackAttributes =>
          Boolean(attributes?.name && attributes.artistName),
      )
      .map((attributes) => ({
        title: attributes.name,
        artistName: attributes.artistName,
        links: attributes.url ? { appleMusic: attributes.url } : {},
        albumName: attributes.albumName,
        previewUrl: attributes.previews?.[0]?.url,
        coverUrl: appleArtwork(attributes.artwork?.url),
        durationMs: attributes.durationInMillis,
      }));
    return {
      name: playlist.attributes.name,
      description: playlist.attributes.description?.standard ?? "",
      coverUrl: appleArtwork(playlist.attributes.artwork?.url),
      platform: "appleMusic",
      sourceId: playlistId,
      tracks,
    };
  } catch {
    return null;
  }
}

interface ITunesLookupAlbum {
  wrapperType?: string;
  collectionType?: string;
  collectionId?: number;
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  collectionViewUrl?: string;
}

interface ITunesLookupSong {
  wrapperType?: string;
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  trackViewUrl?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  releaseDate?: string;
}

async function itunesLookup(
  id: string,
  entity: string,
  country: string,
  limit: number,
): Promise<unknown[]> {
  const query = new URLSearchParams({
    id,
    entity,
    country,
    limit: String(limit),
  });
  const response = await fetch(
    `https://itunes.apple.com/lookup?${query.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) return [];
  const data = (await response.json()) as { results?: unknown[] };
  return data.results ?? [];
}

export interface AppleHealth {
  lookupOk: boolean;
  detail: string;
}

export async function checkAppleHealth(): Promise<AppleHealth> {
  try {
    const items = await itunesLookup("909253", "album", "US", 1);
    if (items.length === 0) {
      return { lookupOk: false, detail: "Lookup returned no results." };
    }
    return { lookupOk: true, detail: "Lookup succeeded (no key needed)." };
  } catch {
    return { lookupOk: false, detail: "Network error." };
  }
}

export async function fetchAppleArtistCatalogViaLookup(
  artistId: string,
  country = "US",
): Promise<ImportedArtistCatalog | null> {
  try {
    if (!/^\d+$/.test(artistId)) return null;
    const collections = (
      await itunesLookup(artistId, "album", country, 200)
    ).filter(
      (item): item is ITunesLookupAlbum =>
        typeof item === "object" &&
        item !== null &&
        (item as ITunesLookupAlbum).wrapperType === "collection" &&
        typeof (item as ITunesLookupAlbum).collectionName === "string",
    );
    if (collections.length === 0) return null;
    const albums = collections.slice(0, 100).map((album) => ({
      title: album.collectionName!,
      releaseYear: album.releaseDate?.slice(0, 4) ?? "",
      links: album.collectionViewUrl
        ? { appleMusic: album.collectionViewUrl }
        : {},
      platformIds:
        album.collectionId !== undefined
          ? { appleMusic: String(album.collectionId) }
          : {},
    }));
    const songs: ImportedArtistCatalog["songs"] = [];
    for (const album of collections.slice(0, 60)) {
      if (album.collectionId === undefined) continue;
      const tracks = (
        await itunesLookup(String(album.collectionId), "song", country, 200)
      ).filter(
        (item): item is ITunesLookupSong =>
          typeof item === "object" &&
          item !== null &&
          (item as ITunesLookupSong).wrapperType === "track" &&
          typeof (item as ITunesLookupSong).trackName === "string",
      );
      const isSingle = album.collectionType === "Single";
      for (const track of tracks) {
        if (!track.artistName) continue;
        songs.push({
          title: track.trackName!,
          artistName: track.artistName,
          releaseYear: track.releaseDate?.slice(0, 4) ?? "",
          type: isSingle ? "single" : "album-track",
          album: isSingle ? undefined : album.collectionName,
          coverUrl: upscaleArtwork(track.artworkUrl100),
          links: track.trackViewUrl ? { appleMusic: track.trackViewUrl } : {},
          previewUrl: track.previewUrl,
          platformIds:
            track.trackId !== undefined
              ? { appleMusic: String(track.trackId) }
              : {},
        });
        if (songs.length >= 500) break;
      }
      if (songs.length >= 500) break;
    }
    return { albums, songs };
  } catch {
    return null;
  }
}

export async function fetchAppleArtistCatalog(
  artistId: string,
  storefront: string,
): Promise<ImportedArtistCatalog | null> {
  try {
    const token = appleDeveloperToken();
    if (!token) return null;
    const headers = { Authorization: `Bearer ${token}` };
    const base = `https://api.music.apple.com/v1/catalog/${encodeURIComponent(storefront)}/artists/${encodeURIComponent(artistId)}/albums`;
    const response = await fetch(`${base}?limit=100`, {
      headers,
      cache: "no-store",
    });
    if (!response.ok) return null;
    const firstPage = (await response.json()) as AppleArtistAlbumsResponse;
    const albumItems = [...(firstPage.data ?? [])];
    let next = firstPage.next;
    while (next && albumItems.length < 100) {
      const pageResponse = await fetch(absoluteAppleUrl(next, storefront), {
        headers,
        cache: "no-store",
      });
      if (!pageResponse.ok) break;
      const page = (await pageResponse.json()) as AppleArtistAlbumsResponse;
      albumItems.push(...(page.data ?? []));
      next = page.next;
    }

    const albums = albumItems
      .filter((album) => album.attributes?.name)
      .map((album) => ({
        title: album.attributes!.name,
        releaseYear: album.attributes!.releaseDate?.slice(0, 4) ?? "",
        links: album.attributes!.url
          ? { appleMusic: album.attributes!.url }
          : {},
        platformIds: { appleMusic: album.id },
      }));
    const songs: ImportedArtistCatalog["songs"] = [];
    for (const album of albumItems) {
      if (!album.attributes?.name) continue;
      const tracksUrl = `https://api.music.apple.com/v1/catalog/${encodeURIComponent(storefront)}/albums/${encodeURIComponent(album.id)}/tracks?limit=100`;
      const tracksResponse = await fetch(tracksUrl, {
        headers,
        cache: "no-store",
      });
      if (!tracksResponse.ok) continue;
      const firstTracks = (await tracksResponse.json()) as AppleTracksResponse;
      const trackItems = [...(firstTracks.data ?? [])];
      let trackNext = firstTracks.next;
      while (trackNext && trackItems.length < 100) {
        const pageResponse = await fetch(
          absoluteAppleUrl(trackNext, storefront),
          { headers, cache: "no-store" },
        );
        if (!pageResponse.ok) break;
        const page = (await pageResponse.json()) as AppleTracksResponse;
        trackItems.push(...(page.data ?? []));
        trackNext = page.next;
      }
      for (const track of trackItems) {
        const attributes = track.attributes;
        if (!attributes?.name || !attributes.artistName) continue;
        songs.push({
          title: attributes.name,
          artistName: attributes.artistName,
          releaseYear: album.attributes.releaseDate?.slice(0, 4) ?? "",
          type: "album-track",
          album: album.attributes.name,
          coverUrl: appleArtwork(attributes.artwork?.url),
          links: attributes.url ? { appleMusic: attributes.url } : {},
          previewUrl: attributes.previews?.[0]?.url,
          isrc: attributes.isrc,
          platformIds: { appleMusic: track.id },
        });
      }
    }
    return { albums, songs };
  } catch {
    return null;
  }
}
