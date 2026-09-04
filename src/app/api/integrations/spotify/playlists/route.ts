import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/db";
import {
  fetchSpotifyUserPlaylists,
  fetchSpotifyUserPublicPlaylists,
  type SpotifyPublicPlaylist,
} from "@/lib/platforms/spotify";
import {
  getSpotifyConnection,
  getSpotifyUserAccessToken,
} from "@/lib/platforms/spotify-auth";

function parseSpotifyUserId(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    if (!["open.spotify.com", "spotify.com"].includes(url.hostname.toLowerCase())) {
      return null;
    }
    const match = url.pathname.match(/\/user\/([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required." },
      { status: 400 },
    );
  }
  const connection = getSpotifyConnection();
  if (connection.connected) {
    const userToken = await getSpotifyUserAccessToken();
    const playlists = userToken
      ? await fetchSpotifyUserPlaylists(userToken)
      : null;
    if (!playlists) {
      return NextResponse.json(
        { error: "Could not read the connected Spotify account." },
        { status: 502 },
      );
    }
    return NextResponse.json({
      source: "oauth",
      userName: connection.userName,
      playlists,
    });
  }
  const userId = parseSpotifyUserId(getSetting("spotify_account_url"));
  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Connect a Spotify account with OAuth, or save the account profile URL first.",
      },
      { status: 400 },
    );
  }
  const playlists: SpotifyPublicPlaylist[] | null =
    await fetchSpotifyUserPublicPlaylists(userId);
  if (!playlists) {
    return NextResponse.json(
      { error: "Could not read that Spotify account's public playlists." },
      { status: 502 },
    );
  }
  return NextResponse.json({ source: "public", userName: null, playlists });
}
