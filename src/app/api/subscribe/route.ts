import { NextResponse, type NextRequest } from "next/server";
import {
  addSubscriber,
  getPublicPlaylist,
  subscribeToPlaylist,
} from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let email = "";
  let playlistSlug = "";
  let globalUpdates: boolean | undefined;
  try {
    const body = (await request.json()) as {
      email?: string;
      playlistSlug?: string;
      globalUpdates?: boolean;
    };
    email = (body.email ?? "").trim().toLowerCase();
    playlistSlug = (body.playlistSlug ?? "").trim();
    globalUpdates = body.globalUpdates;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (playlistSlug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(playlistSlug)) {
      return NextResponse.json({ error: "Invalid playlist." }, { status: 400 });
    }
    if (!getPublicPlaylist(playlistSlug)) {
      return NextResponse.json({ error: "Playlist not found." }, { status: 404 });
    }
    const result = subscribeToPlaylist(
      email,
      playlistSlug,
      globalUpdates === true,
    );
    return NextResponse.json({
      ok: true,
      message: result.playlistAdded
        ? "You're subscribed to this playlist's new-track updates."
        : "You're already subscribed to this playlist.",
    });
  }
  const { added } = addSubscriber(email, true);
  return NextResponse.json({
    ok: true,
    message: added
      ? "You're in. We'll email you when something new drops."
      : "You're already on the list.",
  });
}
