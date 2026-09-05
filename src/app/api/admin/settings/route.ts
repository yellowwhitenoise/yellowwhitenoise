import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  setSetting,
} from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ enabled: getNotificationsEnabled() });
}

const KNOWN_KEYS = new Set([
  "playlist_sync_interval_minutes",
  "artist_sync_interval_minutes",
  "haptics_enabled",
  "playlist_style",
  "playlist_style_mobile",
  "playlist_style_desktop",
  "tap_hide_enabled",
  "tap_hide_playlist",
  "playlist_bottom_nav",
  "home_backdrop",
  "auto_ads",
  "google_preferred_sources_url",
  "notifications_enabled",
]);

export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    enabled?: boolean;
    key?: string;
    value?: string;
  };
  if (typeof body.enabled === "boolean") {
    setNotificationsEnabled(body.enabled);
  }
  if (body.key) {
    if (!KNOWN_KEYS.has(body.key)) {
      return NextResponse.json(
        { error: `Unknown setting: ${body.key}` },
        { status: 400 },
      );
    }
    if (String(body.value ?? "").length > 20000) {
      return NextResponse.json(
        { error: "Setting value too long." },
        { status: 400 },
      );
    }
    setSetting(body.key, String(body.value ?? ""));
  }
  return NextResponse.json({ enabled: getNotificationsEnabled() });
}
