import type { ResolvedEntity } from "./types";
import { isPlausibleMatch } from "./types";
import type { ImportedPlaylist } from "./playlist-types";
import type { ImportedArtistCatalog } from "./artist-types";

interface YouTubeSearchItem {
  id: { videoId?: string; playlistId?: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails?: { high?: { url: string } };
  };
}

interface YouTubePlaylistItem {
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt?: string;
    thumbnails?: { high?: { url: string } };
    resourceId?: { videoId?: string };
  };
}

interface YouTubePlaylistResponse {
  items?: {
    snippet?: {
      title?: string;
      description?: string;
      thumbnails?: { high?: { url: string } };
    };
  }[];
}

interface YouTubePlaylistItemsResponse {
  nextPageToken?: string;
  items?: YouTubePlaylistItem[];
}

interface YouTubeChannelResponse {
  items?: {
    snippet?: { title?: string };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }[];
}

async function youtubeSearch(
  params: Record<string, string>,
): Promise<YouTubeSearchItem | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const query = new URLSearchParams({
    part: "snippet",
    maxResults: "3",
    key,
    ...params,
  });
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${query.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as { items?: YouTubeSearchItem[] };
  return data.items?.[0] ?? null;
}

export interface YoutubeHealth {
  configured: boolean;
  searchOk: boolean;
  detail: string;
}

export async function checkYoutubeHealth(): Promise<YoutubeHealth> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return {
      configured: false,
      searchOk: false,
      detail: "YOUTUBE_API_KEY missing.",
    };
  }
  try {
    const query = new URLSearchParams({
      part: "snippet",
      type: "video",
      q: "Tyla Water",
      maxResults: "1",
      key,
    });
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${query.toString()}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      return {
        configured: true,
        searchOk: false,
        detail: `Search rejected (HTTP ${response.status}). Check key restrictions and quota.`,
      };
    }
    return { configured: true, searchOk: true, detail: "Search succeeded." };
  } catch {
    return { configured: true, searchOk: false, detail: "Network error." };
  }
}

export async function youtubeTrack(
  title: string,
  artist: string,
): Promise<ResolvedEntity | null> {
  try {
    const item = await youtubeSearch({
      type: "video",
      videoCategoryId: "10",
      q: `${title} ${artist}`,
    });
    const videoId = item?.id.videoId;
    if (!videoId) return null;
    if (!isPlausibleMatch(item.snippet.title, title)) return null;
    return {
      matched: true,
      links: { youtubeMusic: `https://music.youtube.com/watch?v=${videoId}` },
      artworkUrl: item.snippet.thumbnails?.high?.url,
    };
  } catch {
    return null;
  }
}

export async function youtubePlaylist(
  name: string,
  curator: string,
): Promise<ResolvedEntity | null> {
  try {
    const item = await youtubeSearch({
      type: "playlist",
      q: `${name} ${curator}`,
    });
    const playlistId = item?.id.playlistId;
    if (!playlistId) return null;
    return {
      matched: true,
      links: {
        youtubeMusic: `https://music.youtube.com/playlist?list=${playlistId}`,
      },
    };
  } catch {
    return null;
  }
}

export async function fetchYoutubePlaylist(
  playlistId: string,
): Promise<ImportedPlaylist | null> {
  try {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return null;
    const metadataQuery = new URLSearchParams({
      part: "snippet",
      id: playlistId,
      key,
    });
    const metadataResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?${metadataQuery.toString()}`,
      { cache: "no-store" },
    );
    if (!metadataResponse.ok) return null;
    const metadata = (await metadataResponse.json()) as YouTubePlaylistResponse;
    const playlist = metadata.items?.[0]?.snippet;
    if (!playlist?.title) return null;

    const items: YouTubePlaylistItem[] = [];
    let pageToken = "";
    do {
      const query = new URLSearchParams({
        part: "snippet",
        playlistId,
        maxResults: "50",
        key,
      });
      if (pageToken) query.set("pageToken", pageToken);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${query.toString()}`,
        { cache: "no-store" },
      );
      if (!response.ok) break;
      const page = (await response.json()) as YouTubePlaylistItemsResponse;
      items.push(...(page.items ?? []));
      pageToken = page.nextPageToken ?? "";
    } while (pageToken && items.length < 500);

    const tracks = items
      .map((item) => {
        const videoId = item.snippet.resourceId?.videoId;
        if (!videoId || !item.snippet.title) return null;
        return {
          title: item.snippet.title,
          artistName: item.snippet.channelTitle,
          links: {
            youtubeMusic: `https://music.youtube.com/watch?v=${videoId}`,
          },
          coverUrl: item.snippet.thumbnails?.high?.url,
        };
      })
      .filter((track): track is NonNullable<typeof track> => Boolean(track));

    return {
      name: playlist.title,
      description: playlist.description ?? "",
      coverUrl: playlist.thumbnails?.high?.url,
      platform: "youtubeMusic",
      sourceId: playlistId,
      tracks,
    };
  } catch {
    return null;
  }
}

export interface YoutubeAccountPlaylist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  url: string;
  coverUrl?: string;
}

async function resolveYoutubeChannelId(
  channelRef: string,
  key: string,
): Promise<string | null> {
  const ref = channelRef.trim();
  if (/^UC[\w-]{20,}$/.test(ref)) return ref;
  try {
    if (ref.startsWith("@")) {
      const query = new URLSearchParams({
        part: "id",
        forHandle: ref,
        key,
      });
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?${query.toString()}`,
        { cache: "no-store" },
      );
      if (!response.ok) return null;
      const data = (await response.json()) as { items?: { id?: string }[] };
      return data.items?.[0]?.id ?? null;
    }
    const query = new URLSearchParams({
      part: "id",
      forUsername: ref,
      key,
    });
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${query.toString()}`,
      { cache: "no-store" },
    );
    if (response.ok) {
      const data = (await response.json()) as { items?: { id?: string }[] };
      if (data.items?.[0]?.id) return data.items[0].id;
    }
    const searchQuery = new URLSearchParams({
      part: "snippet",
      type: "channel",
      q: ref,
      maxResults: "1",
      key,
    });
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchQuery.toString()}`,
      { cache: "no-store" },
    );
    if (!searchResponse.ok) return null;
    const searchData = (await searchResponse.json()) as {
      items?: { snippet?: { channelId?: string } }[];
    };
    return searchData.items?.[0]?.snippet?.channelId ?? null;
  } catch {
    return null;
  }
}

export async function fetchYoutubeChannelPlaylists(
  channelRef: string,
): Promise<YoutubeAccountPlaylist[] | null> {
  try {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key || !channelRef.trim()) return null;
    const channelId = await resolveYoutubeChannelId(channelRef, key);
    if (!channelId) return null;
    const playlists: YoutubeAccountPlaylist[] = [];
    let pageToken = "";
    do {
      const query = new URLSearchParams({
        part: "snippet,contentDetails",
        channelId,
        maxResults: "50",
        key,
      });
      if (pageToken) query.set("pageToken", pageToken);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?${query.toString()}`,
        { cache: "no-store" },
      );
      if (!response.ok) return null;
      const page = (await response.json()) as {
        nextPageToken?: string;
        items?: {
          id?: string;
          snippet?: {
            title?: string;
            description?: string;
            thumbnails?: { high?: { url: string } };
          };
          contentDetails?: { itemCount?: number };
        }[];
      };
      for (const item of page.items ?? []) {
        if (!item.id || !item.snippet?.title) continue;
        playlists.push({
          id: item.id,
          name: item.snippet.title,
          description: item.snippet.description ?? "",
          trackCount: item.contentDetails?.itemCount ?? 0,
          url: `https://www.youtube.com/playlist?list=${item.id}`,
          coverUrl: item.snippet.thumbnails?.high?.url,
        });
      }
      pageToken = page.nextPageToken ?? "";
    } while (pageToken && playlists.length < 200);
    return playlists;
  } catch {
    return null;
  }
}

export async function fetchYoutubeArtistCatalog(
  channelId: string,
  artistName: string,
): Promise<ImportedArtistCatalog | null> {
  try {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return null;
    const channelQuery = new URLSearchParams({
      part: "snippet,contentDetails",
      id: channelId,
      key,
    });
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${channelQuery.toString()}`,
      { cache: "no-store" },
    );
    if (!channelResponse.ok) return null;
    const channelData = (await channelResponse.json()) as YouTubeChannelResponse;
    const uploadsId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return null;

    const items: YouTubePlaylistItem[] = [];
    let pageToken = "";
    do {
      const query = new URLSearchParams({
        part: "snippet",
        playlistId: uploadsId,
        maxResults: "50",
        key,
      });
      if (pageToken) query.set("pageToken", pageToken);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${query.toString()}`,
        { cache: "no-store" },
      );
      if (!response.ok) break;
      const page = (await response.json()) as YouTubePlaylistItemsResponse;
      items.push(...(page.items ?? []));
      pageToken = page.nextPageToken ?? "";
    } while (pageToken && items.length < 500);

    const songs = items
      .map((item) => {
        const videoId = item.snippet.resourceId?.videoId;
        if (!videoId || !item.snippet.title) return null;
        return {
          title: item.snippet.title,
          artistName: artistName || item.snippet.channelTitle,
          releaseYear: item.snippet.publishedAt?.slice(0, 4) ?? "",
          type: "single" as const,
          links: {
            youtubeMusic: `https://music.youtube.com/watch?v=${videoId}`,
          },
          coverUrl: item.snippet.thumbnails?.high?.url,
          platformIds: { youtubeMusic: videoId },
        };
      })
      .filter((song): song is NonNullable<typeof song> => Boolean(song));
    return { albums: [], songs };
  } catch {
    return null;
  }
}
