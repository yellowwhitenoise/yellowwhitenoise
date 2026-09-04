import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  completeSpotifyOAuth,
  getSpotifyRedirectUri,
  getStateCookieName,
  statesMatch,
} from "@/lib/platforms/spotify-auth";

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const storedState = request.cookies.get(getStateCookieName())?.value;
  const redirectUri = getSpotifyRedirectUri(request.nextUrl.origin);
  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(
        `/admin/playlists?spotify=error&reason=${encodeURIComponent(reason)}`,
        request.nextUrl.origin,
      ),
    );

  if (params.get("error")) {
    const response = fail("Spotify authorization was denied.");
    response.cookies.delete(getStateCookieName());
    return response;
  }
  if (!code || !statesMatch(state ?? undefined, storedState)) {
    const response = fail("Invalid OAuth state. Please try connecting again.");
    response.cookies.delete(getStateCookieName());
    return response;
  }
  const profile = await completeSpotifyOAuth(code, redirectUri);
  if (!profile) {
    const failed = fail("Could not complete Spotify authorization.");
    failed.cookies.delete(getStateCookieName());
    return failed;
  }
  const response = NextResponse.redirect(
    new URL("/admin/playlists?spotify=connected", request.nextUrl.origin),
  );
  response.cookies.delete(getStateCookieName());
  return response;
}
