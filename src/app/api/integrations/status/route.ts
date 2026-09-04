import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { checkSpotifyHealth } from "@/lib/platforms/spotify";
import { checkYoutubeHealth } from "@/lib/platforms/youtube";
import { checkAppleHealth } from "@/lib/platforms/apple";
import { getSpotifyConnection } from "@/lib/platforms/spotify-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [spotify, youtube, apple] = await Promise.all([
    checkSpotifyHealth(),
    checkYoutubeHealth(),
    checkAppleHealth(),
  ]);
  const oauth = getSpotifyConnection();
  return NextResponse.json({
    spotify: { ...spotify, oauthConnected: oauth.connected },
    youtube,
    apple,
  });
}
