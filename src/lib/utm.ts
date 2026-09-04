const UTM_KEY = "ywn-utm";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const;

export function captureUtm() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  let stored: Record<string, string> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "{}") as Record<
      string,
      string
    >;
  } catch {
    stored = {};
  }
  let changed = false;
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      stored[key] = value;
      changed = true;
    }
  }
  if (changed) sessionStorage.setItem(UTM_KEY, JSON.stringify(stored));
}

export function getUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

export function buildOutboundUrl(url: string): string {
  const utm = getUtm();
  const entries = Object.entries(utm);
  if (!entries.length) return url;
  try {
    const parsed = new URL(url);
    for (const [key, value] of entries) {
      if (!parsed.searchParams.has(key)) parsed.searchParams.set(key, value);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
