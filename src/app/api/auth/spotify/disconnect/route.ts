import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { clearSpotifyConnection } from "@/lib/platforms/spotify-auth";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  clearSpotifyConnection();
  return NextResponse.json({ ok: true });
}
