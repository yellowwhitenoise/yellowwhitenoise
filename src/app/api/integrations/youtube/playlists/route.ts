import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSetting } from "@/lib/db";
import { fetchYoutubeChannelPlaylists } from "@/lib/platforms/youtube";

function parseChannelRef(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^UC[\w-]{20,}$/.test(trimmed) || trimmed.startsWith("@")) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (
      !["music.youtube.com", "www.youtube.com", "youtube.com"].includes(
        url.hostname.toLowerCase(),
      )
    ) {
      return null;
    }
    const channelMatch = url.pathname.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) return channelMatch[1];
    const handleMatch = url.pathname.match(/\/(@[^/]+)/);
    if (handleMatch) return handleMatch[1];
    const segments = url.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    return last && last !== "playlists" ? last : null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY is required." },
      { status: 400 },
    );
  }
  const channelRef = parseChannelRef(getSetting("youtube_account_url"));
  if (!channelRef) {
    return NextResponse.json(
      { error: "Save the YouTube channel URL first." },
      { status: 400 },
    );
  }
  const playlists = await fetchYoutubeChannelPlaylists(channelRef);
  if (!playlists) {
    return NextResponse.json(
      { error: "Could not read that YouTube channel's playlists." },
      { status: 502 },
    );
  }
  return NextResponse.json({ source: "channel", playlists });
}
