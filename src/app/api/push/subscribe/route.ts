import { NextResponse, type NextRequest } from "next/server";
import { upsertPushSubscription } from "@/lib/db";
import { isPushConfigured } from "@/lib/push";

function parsePlaylists(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is string =>
        typeof entry === "string" && entry.trim().length > 0,
    )
    .map((entry) => entry.trim().slice(0, 120))
    .slice(0, 50);
}

export async function POST(request: NextRequest) {
  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications are not configured." },
      { status: 503 },
    );
  }
  const body = (await request.json().catch(() => ({}))) as {
    subscription?: {
      endpoint?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
    };
    playlists?: unknown;
  };
  const endpoint =
    typeof body.subscription?.endpoint === "string"
      ? body.subscription.endpoint
      : "";
  const p256dh =
    typeof body.subscription?.keys?.p256dh === "string"
      ? body.subscription.keys.p256dh
      : "";
  const auth =
    typeof body.subscription?.keys?.auth === "string"
      ? body.subscription.keys.auth
      : "";
  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return NextResponse.json(
      { error: "A valid push subscription is required." },
      { status: 400 },
    );
  }
  if (endpointUrl.protocol !== "https:" || !p256dh || !auth) {
    return NextResponse.json(
      { error: "A valid push subscription is required." },
      { status: 400 },
    );
  }
  upsertPushSubscription(endpoint, p256dh, auth, parsePlaylists(body.playlists));
  return NextResponse.json({ ok: true });
}
