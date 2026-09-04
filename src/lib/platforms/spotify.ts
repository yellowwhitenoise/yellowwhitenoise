import type { ResolvedEntity } from "./types";
import { isPlausibleMatch } from "./types";
import type { ImportedPlaylist } from "./playlist-types";
import type { ImportedArtistCatalog } from "./artist-types";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.value;
}

export interface SpotifyHealth {
  configured: boolean;
  tokenOk: boolean;
  searchOk: boolean;
  detail: string;
}

export async function checkSpotifyHealth(): Promise<SpotifyHealth> {
  const configured = Boolean(
    process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET,
  );
  if (!configured) {
    return {
      configured: false,
      tokenOk: false,
      searchOk: false,
      detail: "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing.",
    };
  }
  cachedToken = null;
  const token = await getAccessToken();
  if (!token) {
    return {
      configured: true,
      tokenOk: false,
      searchOk: false,
      detail:
        "Token request failed. Verify the client ID/secret pair in the Spotify dashboard.",
    };
  }
  const probe = await debugSpotifySearch("track:Water artist:Tyla");
  if (!probe.item) {
    return {
      configured: true,
      tokenOk: true,
      searchOk: false,
      detail:
        `Search HTTP ${probe.status ?? "failed"} with zero usable items` +
        (probe.error ? `: ${probe.error} ` : ". ") +
        (probe.status === 401 || probe.status === 403
          ? "Token rejected by the API. Recreate the client secret in the Spotify dashboard."
          : probe.status === 429
            ? "Rate limited. Try again in a few minutes."
            : "Check the app's API access in the Spotify dashboard."),
    };
  }
  return {
    configured: true,
    tokenOk: true,
    searchOk: true,
    detail: `Token + search work (e.g. "${probe.item.name}").`,
  };
}

export async function debugSpotifySearch(
  query: string,
): Promise<{ status: number | null; item: SpotifyItem | null; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return { status: null, item: null };
    const response = await fetch(
      `https://api.spotify.com/v1/search?type=track&limit=3&q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
    );
    if (!response.ok) {
      const body = (await response.text().catch(() => "")).slice(0, 200);
      return { status: response.status, item: null, error: body };
    }
    const data = (await response.json()) as {
      tracks?: { items?: SpotifyItem[] };
    };
    return { status: response.status, item: data.tracks?.items?.[0] ?? null };
  } catch {
    return { status: null, item: null };
  }
}

interface SpotifyImage {
  url: string;
}

interface SpotifyItem {
  id: string;
  name: string;
  preview_url: string | null;
  external_urls: { spotify: string };
  artists?: { name: string }[];
  album?: { images: SpotifyImage[] };
  images?: SpotifyImage[];
  duration_ms?: number;
  album_name?: string;
  external_ids?: { isrc?: string };
}

interface SpotifyPlaylistResponse {
  name: string;
  description: string | null;
  external_urls?: { spotify?: string };
  images?: SpotifyImage[];
  tracks: {
    items: { track?: SpotifyItem | null }[];
    next: string | null;
  };
}

interface SpotifyArtistAlbum {
  id: string;
  name: string;
  album_type: "album" | "single" | "compilation";
  release_date: string;
  external_urls?: { spotify?: string };
  images?: SpotifyImage[];
}

interface SpotifyArtistAlbumsPage {
  items: SpotifyArtistAlbum[];
  next: string | null;
}

interface SpotifyAlbumTracksPage {
  items: SpotifyItem[];
  next: string | null;
}

export const SINGULAR_TYPE = {
  tracks: "track",
  albums: "album",
  playlists: "playlist",
} as const;

async function search(
  type: "tracks" | "albums" | "playlists",
  query: string,
): Promise<SpotifyItem | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  // NB: the query takes the SINGULAR type ("track"), while the JSON
  // response nests items under the PLURAL key ("tracks").
  const response = await fetch(
    `https://api.spotify.com/v1/search?type=${SINGULAR_TYPE[type]}&limit=3&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as {
    [key: string]: { items: SpotifyItem[] } | undefined;
  };
  return data[type]?.items?.[0] ?? null;
}

export async function spotifyTrack(
  title: string,
  artist: string,
): Promise<ResolvedEntity | null> {
  try {
    const item = await search("tracks", `track:${title} artist:${artist}`);
    if (!item) return null;
    const artistNames = (item.artists ?? [])
      .map((entry) => entry.name)
      .join(" ");
    if (!isPlausibleMatch(artistNames || item.name, artist)) return null;
    return {
      matched: true,
      links: { spotify: item.external_urls.spotify },
      previewUrl: item.preview_url ?? undefined,
      artworkUrl: item.album?.images?.[0]?.url,
    };
  } catch {
    return null;
  }
}

export async function spotifyAlbum(
  title: string,
  artist: string,
): Promise<ResolvedEntity | null> {
  try {
    const item = await search("albums", `album:${title} artist:${artist}`);
    if (!item) return null;
    const artistNames = (item.artists ?? [])
      .map((entry) => entry.name)
      .join(" ");
    if (!isPlausibleMatch(artistNames || item.name, artist)) return null;
    return {
      matched: true,
      links: { spotify: item.external_urls.spotify },
      artworkUrl: item.images?.[0]?.url,
    };
  } catch {
    return null;
  }
}

export async function spotifyPlaylist(
  name: string,
  curator: string,
): Promise<ResolvedEntity | null> {
  try {
    const item = await search("playlists", `${name} ${curator}`);
    if (!item) return null;
    if (!isPlausibleMatch(item.name, name)) return null;
    return {
      matched: true,
      links: { spotify: item.external_urls.spotify },
      artworkUrl: item.images?.[0]?.url,
    };
  } catch {
    return null;
  }
}

function cleanDescription(value: string | null | undefined): string {
  return value?.replace(/<[^>]*>/g, "").trim() ?? "";
}

export async function fetchSpotifyPlaylist(
  playlistId: string,
  userAccessToken?: string | null,
): Promise<ImportedPlaylist | null> {
  try {
    const accessToken = userAccessToken ?? (await getAccessToken());
    if (!accessToken) return null;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}`,
      { headers, cache: "no-store" },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as SpotifyPlaylistResponse;
    const items = [...data.tracks.items];
    let next = data.tracks.next;
    while (next && items.length < 500) {
      const pageResponse = await fetch(next, { headers, cache: "no-store" });
      if (!pageResponse.ok) break;
      const page = (await pageResponse.json()) as SpotifyPlaylistResponse["tracks"];
      items.push(...page.items);
      next = page.next;
    }
    const tracks = items
      .map((item) => item.track)
      .filter((track): track is SpotifyItem => Boolean(track?.name && track.artists?.length))
      .map((track) => ({
        title: track.name,
        artistName: track.artists!.map((artist) => artist.name).join(", "),
        links: track.external_urls?.spotify
          ? { spotify: track.external_urls.spotify }
          : {},
        albumName: track.album_name,
        previewUrl: track.preview_url ?? undefined,
        coverUrl: track.album?.images?.[0]?.url,
        durationMs: track.duration_ms,
      }));
    return {
      name: data.name,
      description: cleanDescription(data.description),
      coverUrl: data.images?.[0]?.url,
      platform: "spotify",
      sourceId: playlistId,
      tracks,
    };
  } catch {
    return null;
  }
}

interface SpotifyUserPlaylistsPage {
  items: {
    id: string;
    name: string;
    description: string | null;
    public: boolean | null;
    collaborative: boolean;
    external_urls?: { spotify?: string };
    images?: SpotifyImage[];
    tracks?: { total?: number };
    owner?: { display_name?: string };
  }[];
  next: string | null;
}

export interface SpotifyPublicPlaylist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  isPublic: boolean;
  collaborative: boolean;
  url: string;
  coverUrl?: string;
  ownerName?: string;
}

function mapUserPlaylist(
  item: SpotifyUserPlaylistsPage["items"][number],
): SpotifyPublicPlaylist | null {
  if (!item?.id) return null;
  return {
    id: item.id,
    name: item.name,
    description: (item.description ?? "").replace(/<[^>]*>/g, "").trim(),
    trackCount: item.tracks?.total ?? 0,
    isPublic: item.public ?? false,
    collaborative: item.collaborative,
    url:
      item.external_urls?.spotify ??
      `https://open.spotify.com/playlist/${item.id}`,
    coverUrl: item.images?.[0]?.url,
    ownerName: item.owner?.display_name,
  };
}

async function paginateUserPlaylists(
  firstUrl: string,
  headers: { Authorization: string },
): Promise<SpotifyPublicPlaylist[] | null> {
  try {
    const playlists: SpotifyPublicPlaylist[] = [];
    let next: string | null = firstUrl;
    while (next && playlists.length < 200) {
      const response = await fetch(next, { headers, cache: "no-store" });
      if (!response.ok) return null;
      const page = (await response.json()) as SpotifyUserPlaylistsPage;
      for (const item of page.items ?? []) {
        const mapped = mapUserPlaylist(item);
        if (mapped) playlists.push(mapped);
      }
      next = page.next;
    }
    return playlists;
  } catch {
    return null;
  }
}

export async function fetchSpotifyUserPublicPlaylists(
  userId: string,
): Promise<SpotifyPublicPlaylist[] | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  return paginateUserPlaylists(
    `https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists?limit=50`,
    { Authorization: `Bearer ${accessToken}` },
  );
}

export async function fetchSpotifyUserPlaylists(
  userAccessToken: string,
): Promise<SpotifyPublicPlaylist[] | null> {
  return paginateUserPlaylists(
    "https://api.spotify.com/v1/me/playlists?limit=50",
    { Authorization: `Bearer ${userAccessToken}` },
  );
}

export async function fetchSpotifyArtistCatalog(
  artistId: string,
  artistName: string,
): Promise<ImportedArtistCatalog | null> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return null;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const albumsQuery = new URLSearchParams({
      include_groups: "album,single,compilation",
      limit: "50",
    });
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}/albums?${albumsQuery.toString()}`,
      { headers, cache: "no-store" },
    );
    if (!response.ok) return null;
    const firstPage = (await response.json()) as SpotifyArtistAlbumsPage;
    const albumItems = [...firstPage.items];
    let next = firstPage.next;
    while (next && albumItems.length < 100) {
      const pageResponse = await fetch(next, { headers, cache: "no-store" });
      if (!pageResponse.ok) break;
      const page = (await pageResponse.json()) as SpotifyArtistAlbumsPage;
      albumItems.push(...page.items);
      next = page.next;
    }

    const albums = albumItems
      .filter((album) => album.album_type !== "single")
      .map((album) => ({
        title: album.name,
        releaseYear: album.release_date?.slice(0, 4) ?? "",
        links: album.external_urls?.spotify
          ? { spotify: album.external_urls.spotify }
          : {},
        platformIds: { spotify: album.id },
      }));
    const songs: ImportedArtistCatalog["songs"] = [];
    for (const album of albumItems) {
      const tracksQuery = new URLSearchParams({ limit: "50" });
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/albums/${encodeURIComponent(album.id)}/tracks?${tracksQuery.toString()}`,
        { headers, cache: "no-store" },
      );
      if (!tracksResponse.ok) continue;
      const tracksPage = (await tracksResponse.json()) as SpotifyAlbumTracksPage;
      const trackItems = [...tracksPage.items];
      let trackNext = tracksPage.next;
      while (trackNext && trackItems.length < 100) {
        const pageResponse = await fetch(trackNext, {
          headers,
          cache: "no-store",
        });
        if (!pageResponse.ok) break;
        const page = (await pageResponse.json()) as SpotifyAlbumTracksPage;
        trackItems.push(...page.items);
        trackNext = page.next;
      }
      for (const track of trackItems) {
        if (!track.name) continue;
        const artists = (track.artists ?? [])
          .map((artist) => artist.name)
          .join(", ");
        songs.push({
          title: track.name,
          artistName: artists || artistName,
          releaseYear: album.release_date?.slice(0, 4) ?? "",
          type: album.album_type === "single" ? "single" : "album-track",
          album: album.album_type === "single" ? undefined : album.name,
          links: track.external_urls?.spotify
            ? { spotify: track.external_urls.spotify }
            : {},
          isrc: track.external_ids?.isrc,
          platformIds: { spotify: track.id },
        });
      }
    }
    return { albums, songs };
  } catch {
    return null;
  }
}
