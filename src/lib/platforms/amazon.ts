import type { ResolvedCatalogEntry } from "./resolve";

const ODESLI_ENDPOINT = "https://api.song.link/v1-alpha.1/links";
const LOOKUP_TIMEOUT_MS = 8000;

interface OdesliResponse {
  linksByPlatform?: Partial<
    Record<string, { url?: string; entityUniqueId?: string }>
  >;
}

/**
 * Amazon Music has no public search API, so Amazon track/album URLs are
 * resolved through the Songlink (Odesli) lookup: given a known Spotify,
 * Apple Music, or YouTube URL for the same recording, it returns the
 * matching Amazon Music URL. Returns null on any failure — callers treat
 * a miss as "no Amazon link" and fall back to existing behavior.
 */
export async function amazonMusicMatch(
  sourceUrl: string | undefined,
): Promise<ResolvedCatalogEntry | null> {
  if (!sourceUrl) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const endpoint = `${ODESLI_ENDPOINT}?url=${encodeURIComponent(sourceUrl)}&userCountry=US`;
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) return null;
    const data = (await response.json()) as OdesliResponse;
    const url = data.linksByPlatform?.amazonMusic?.url;
    if (!url) return null;
    let hostname = "";
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {
      return null;
    }
    if (hostname !== "music.amazon.com") return null;
    return { matched: true, links: { amazonMusic: url } };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
