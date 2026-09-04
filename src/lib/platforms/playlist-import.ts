import type { Platform } from "@/lib/data";
import { fetchApplePlaylist } from "./apple";
import type { ImportedPlaylist } from "./playlist-types";
import { fetchSpotifyPlaylist } from "./spotify";
import { fetchYoutubePlaylist } from "./youtube";

export interface ImportedPlaylistWithSource extends ImportedPlaylist {
  sourceUrl: string;
}

interface ParsedPlaylistUrl {
  platform: Platform;
  id: string;
  storefront?: string;
}

function isHost(hostname: string, ...hosts: string[]): boolean {
  return hosts.includes(hostname.toLowerCase());
}

function parsePlaylistUrl(rawUrl: string): ParsedPlaylistUrl {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error("Enter a valid Spotify, Apple Music, or YouTube Music URL.");
  }

  if (isHost(url.hostname, "open.spotify.com", "spotify.com")) {
    const match = url.pathname.match(/\/playlist\/([A-Za-z0-9]+)$/);
    if (match) return { platform: "spotify", id: match[1] };
  }

  if (isHost(url.hostname, "music.apple.com", "itunes.apple.com")) {
    const id = url.pathname.split("/").find((part) => /^pl\./i.test(part));
    if (id) {
      const storefront = url.pathname.split("/")[1] || "us";
      return {
        platform: "appleMusic",
        id,
        storefront: storefront.toLowerCase(),
      };
    }
  }

  if (
    isHost(
      url.hostname,
      "music.youtube.com",
      "www.youtube.com",
      "youtube.com",
    )
  ) {
    const id = url.searchParams.get("list");
    if (id) return { platform: "youtubeMusic", id };
  }

  throw new Error("That is not a supported playlist share URL.");
}

export async function importPlaylistFromUrl(
  rawUrl: string,
  opts?: { spotifyToken?: string | null },
): Promise<ImportedPlaylistWithSource> {
  const parsed = parsePlaylistUrl(rawUrl);
  let playlist: ImportedPlaylist | null = null;
  if (parsed.platform === "spotify") {
    playlist = await fetchSpotifyPlaylist(parsed.id, opts?.spotifyToken);
  } else if (parsed.platform === "appleMusic") {
    playlist = await fetchApplePlaylist(parsed.id, parsed.storefront ?? "us");
  } else {
    playlist = await fetchYoutubePlaylist(parsed.id);
  }
  if (!playlist) {
    const setupHint =
      parsed.platform === "spotify"
        ? "Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET, and make sure the playlist is public."
        : parsed.platform === "appleMusic"
          ? "Configure APPLE_MUSIC_DEVELOPER_TOKEN or the Apple Music signing variables, and make sure the playlist is public."
          : "Check YOUTUBE_API_KEY and make sure the playlist is public.";
    throw new Error(`Could not read that playlist. ${setupHint}`);
  }
  return { ...playlist, sourceUrl: rawUrl.trim() };
}
