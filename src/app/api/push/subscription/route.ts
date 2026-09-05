import { NextResponse, type NextRequest } from "next/server";
import {
  listPlaylistRows,
  setPushSubscriptionPlaylists,
} from "@/lib/db";

function validPushEndpoint(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && value.length <= 500;
  } catch {
    return false;
  }
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    endpoint?: unknown;
    playlists?: unknown;
  };
  if (typeof body.endpoint !== "string" || !validPushEndpoint(body.endpoint)) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }
  // Only accept slugs that actually exist so junk can't be stored.
  const known = new Set(listPlaylistRows().map((row) => row.slug));
  const playlists = Array.isArray(body.playlists)
    ? body.playlists
        .filter(
          (entry): entry is string =>
            typeof entry === "string" && known.has(entry.trim()),
        )
        .map((entry) => entry.trim().slice(0, 120))
        .slice(0, 50)
    : [];
  const updated = setPushSubscriptionPlaylists(body.endpoint, playlists);
  if (!updated) {
    return NextResponse.json({ error: "subscription not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
