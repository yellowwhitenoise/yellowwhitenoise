import {
  createDecipheriv,
  createCipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { getSetting, setSetting } from "@/lib/db";

const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-private",
].join(" ");

const STATE_COOKIE = "spotify_oauth_state";

function authSecret(): string {
  return process.env.AUTH_SECRET || "ywn-dev-secret-change-me";
}

function encryptionKey(): Buffer {
  return scryptSync(authSecret(), "ywn-spotify-oauth", 32);
}

function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`;
}

function decryptSecret(payload: string | null): string | null {
  if (!payload) return null;
  try {
    const [ivHex, tagHex, cipherHex] = payload.split(".");
    if (!ivHex || !tagHex || !cipherHex) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function getSpotifyRedirectUri(origin?: string): string {
  const configured = process.env.SPOTIFY_REDIRECT_URI?.trim();
  if (configured) return configured;
  const base = (origin ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/auth/spotify/callback`;
}

export function newOAuthState(): string {
  return randomBytes(16).toString("hex");
}

export function statesMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function getStateCookieName(): string {
  return STATE_COOKIE;
}

export function spotifyAuthorizeUrl(state: string, redirectUri: string): string | null {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<TokenResponse | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as TokenResponse;
  } catch {
    return null;
  }
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as TokenResponse;
  } catch {
    return null;
  }
}

export interface SpotifyProfile {
  id: string;
  displayName: string | null;
}

export async function fetchSpotifyProfile(
  accessToken: string,
): Promise<SpotifyProfile | null> {
  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      id?: string;
      display_name?: string | null;
    };
    if (!data.id) return null;
    return { id: data.id, displayName: data.display_name ?? null };
  } catch {
    return null;
  }
}

export async function completeSpotifyOAuth(
  code: string,
  redirectUri: string,
): Promise<SpotifyProfile | null> {
  const tokens = await exchangeCode(code, redirectUri);
  if (!tokens?.access_token || !tokens.refresh_token) return null;
  const profile = await fetchSpotifyProfile(tokens.access_token);
  if (!profile) return null;
  setSetting("spotify_access_token", encryptSecret(tokens.access_token));
  setSetting("spotify_refresh_token", encryptSecret(tokens.refresh_token));
  setSetting(
    "spotify_token_expires_at",
    String(Date.now() + tokens.expires_in * 1000),
  );
  setSetting("spotify_user_id", profile.id);
  setSetting("spotify_user_name", profile.displayName ?? "");
  return profile;
}

export function getSpotifyConnection(): {
  connected: boolean;
  userId: string | null;
  userName: string | null;
} {
  const refreshToken = decryptSecret(getSetting("spotify_refresh_token"));
  if (!refreshToken) return { connected: false, userId: null, userName: null };
  return {
    connected: true,
    userId: getSetting("spotify_user_id"),
    userName: getSetting("spotify_user_name"),
  };
}

export function clearSpotifyConnection(): void {
  for (const key of [
    "spotify_access_token",
    "spotify_refresh_token",
    "spotify_token_expires_at",
    "spotify_user_id",
    "spotify_user_name",
  ]) {
    setSetting(key, "");
  }
}

export async function getSpotifyUserAccessToken(): Promise<string | null> {
  const accessToken = decryptSecret(getSetting("spotify_access_token"));
  const expiresAt = Number(getSetting("spotify_token_expires_at") ?? "0");
  if (accessToken && expiresAt > Date.now() + 60_000) return accessToken;
  const refreshToken = decryptSecret(getSetting("spotify_refresh_token"));
  if (!refreshToken) return null;
  const tokens = await refreshAccessToken(refreshToken);
  if (!tokens?.access_token) {
    clearSpotifyConnection();
    return null;
  }
  setSetting("spotify_access_token", encryptSecret(tokens.access_token));
  if (tokens.refresh_token) {
    setSetting("spotify_refresh_token", encryptSecret(tokens.refresh_token));
  }
  setSetting(
    "spotify_token_expires_at",
    String(Date.now() + tokens.expires_in * 1000),
  );
  return tokens.access_token;
}

export interface SpotifyAccountPlaylist {
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

interface SpotifyPlaylistsPage {
  items: {
    id: string;
    name: string;
    description: string | null;
    public: boolean | null;
    collaborative: boolean;
    external_urls?: { spotify?: string };
    images?: { url: string }[];
    tracks?: { total?: number };
    owner?: { display_name?: string };
  }[];
  next: string | null;
}

function mapAccountPlaylist(page: SpotifyPlaylistsPage["items"][number]): SpotifyAccountPlaylist {
  return {
    id: page.id,
    name: page.name,
    description: (page.description ?? "").replace(/<[^>]*>/g, "").trim(),
    trackCount: page.tracks?.total ?? 0,
    isPublic: page.public ?? false,
    collaborative: page.collaborative,
    url: page.external_urls?.spotify ?? `https://open.spotify.com/playlist/${page.id}`,
    coverUrl: page.images?.[0]?.url,
    ownerName: page.owner?.display_name,
  };
}

export async function fetchSpotifyUserPlaylists(): Promise<SpotifyAccountPlaylist[] | null> {
  const accessToken = await getSpotifyUserAccessToken();
  if (!accessToken) return null;
  try {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const playlists: SpotifyAccountPlaylist[] = [];
    let next: string | null =
      "https://api.spotify.com/v1/me/playlists?limit=50";
    while (next && playlists.length < 200) {
      const response = await fetch(next, { headers, cache: "no-store" });
      if (response.status === 401) return null;
      if (!response.ok) return null;
      const page = (await response.json()) as SpotifyPlaylistsPage;
      for (const item of page.items ?? []) {
        if (item?.id) playlists.push(mapAccountPlaylist(item));
      }
      next = page.next;
    }
    return playlists;
  } catch {
    return null;
  }
}
