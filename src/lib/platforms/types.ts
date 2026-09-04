import type { Platform } from "@/lib/data";

export interface ResolvedEntity {
  matched: boolean;
  links: Partial<Record<Platform, string>>;
  previewUrl?: string;
  artworkUrl?: string;
}

export const EMPTY_RESOLVED: ResolvedEntity = { matched: false, links: {} };

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function isPlausibleMatch(haystack: string, needle: string): boolean {
  const h = normalizeText(haystack);
  const n = normalizeText(needle);
  if (!h || !n) return false;
  return h.includes(n) || n.includes(h);
}
