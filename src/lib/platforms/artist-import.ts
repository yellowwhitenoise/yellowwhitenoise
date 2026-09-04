import type { Platform } from "@/lib/data";
import {
  fetchAppleArtistCatalog,
  fetchAppleArtistCatalogViaLookup,
} from "./apple";
import type { ImportedArtistCatalog, ArtistSyncSources } from "./artist-types";
import { fetchSpotifyArtistCatalog } from "./spotify";
import { fetchYoutubeArtistCatalog } from "./youtube";

interface ParsedArtistSource {
  platform: Platform;
  id: string;
  storefront?: string;
}

export interface ImportedArtistCatalogResult {
  catalogs: { platform: Platform; catalog: ImportedArtistCatalog }[];
  failed: Platform[];
}

function supportedHost(hostname: string, hosts: string[]): boolean {
  return hosts.includes(hostname.toLowerCase());
}

function parseArtistSource(platform: Platform, raw: string): ParsedArtistSource {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(`Enter a valid ${platform} artist URL.`);
  }
  if (
    platform === "spotify" &&
    supportedHost(url.hostname, ["open.spotify.com", "spotify.com"])
  ) {
    const match = url.pathname.match(/\/artist\/([A-Za-z0-9]+)$/);
    if (match) return { platform, id: match[1] };
  }
  if (
    platform === "appleMusic" &&
    supportedHost(url.hostname, ["music.apple.com", "itunes.apple.com"])
  ) {
    const match = url.pathname.match(/\/artist\/[^/]+\/([0-9]+)$/i);
    if (match) {
      return {
        platform,
        id: match[1],
        storefront: url.pathname.split("/")[1]?.toLowerCase() || "us",
      };
    }
  }
  if (
    platform === "youtubeMusic" &&
    supportedHost(url.hostname, [
      "music.youtube.com",
      "www.youtube.com",
      "youtube.com",
    ])
  ) {
    const match = url.pathname.match(/\/channel\/([A-Za-z0-9_-]+)$/);
    if (match) return { platform, id: match[1] };
  }
  throw new Error(`That is not a supported ${platform} artist URL.`);
}

export async function importArtistCatalog(
  artistName: string,
  sources: ArtistSyncSources,
): Promise<ImportedArtistCatalogResult> {
  const parsed: ParsedArtistSource[] = [];
  for (const platform of ["spotify", "appleMusic", "youtubeMusic"] as Platform[]) {
    const source = sources[platform];
    if (!source?.trim()) continue;
    parsed.push(parseArtistSource(platform, source));
  }
  if (parsed.length === 0) throw new Error("Add at least one artist source URL.");

  const results = await Promise.all(
    parsed.map(async (source) => {
      let catalog: ImportedArtistCatalog | null = null;
      if (source.platform === "spotify") {
        catalog = await fetchSpotifyArtistCatalog(source.id, artistName);
      } else if (source.platform === "appleMusic") {
        catalog = await fetchAppleArtistCatalog(
          source.id,
          source.storefront ?? "us",
        );
        // No developer token? Fall back to the free iTunes Lookup API,
        // which needs no key and covers artist albums + tracks.
        if (!catalog) {
          catalog = await fetchAppleArtistCatalogViaLookup(
            source.id,
            (source.storefront ?? "us").toUpperCase(),
          );
        }
      } else {
        catalog = await fetchYoutubeArtistCatalog(source.id, artistName);
      }
      return { platform: source.platform, catalog };
    }),
  );
  const catalogs = results
    .filter(
      (result): result is { platform: Platform; catalog: ImportedArtistCatalog } =>
        Boolean(result.catalog),
    )
    .map((result) => ({ platform: result.platform, catalog: result.catalog }));
  const failed = results
    .filter((result) => !result.catalog)
    .map((result) => result.platform);
  if (catalogs.length === 0) {
    throw new Error(
      "No artist catalog could be read. Check the source URLs, API credentials, and that the profiles are public.",
    );
  }
  return { catalogs, failed };
}
