import { NextResponse, type NextRequest } from "next/server";
import { setPushSubscriptionPlaylists } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    endpoint?: unknown;
    playlists?: unknown;
  };
  if (typeof body.endpoint !== "string" || !body.endpoint) {
    return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
  }
  const playlists = Array.isArray(body.playlists)
    ? body.playlists
        .filter(
          (entry): entry is string =>
            typeof entry === "string" && entry.trim().length > 0,
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
