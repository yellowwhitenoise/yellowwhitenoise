import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSpotifyConnection } from "@/lib/platforms/spotify-auth";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const connection = getSpotifyConnection();
  return NextResponse.json(connection);
}
