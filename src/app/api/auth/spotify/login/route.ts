import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  getSpotifyRedirectUri,
  getStateCookieName,
  newOAuthState,
  spotifyAuthorizeUrl,
} from "@/lib/platforms/spotify-auth";

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are required." },
      { status: 400 },
    );
  }
  const redirectUri = getSpotifyRedirectUri(request.nextUrl.origin);
  const state = newOAuthState();
  const authorizeUrl = spotifyAuthorizeUrl(state, redirectUri);
  if (!authorizeUrl) {
    return NextResponse.json(
      { error: "Spotify app credentials are missing." },
      { status: 400 },
    );
  }
  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(getStateCookieName(), state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
