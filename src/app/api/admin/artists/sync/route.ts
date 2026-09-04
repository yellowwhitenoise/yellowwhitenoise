import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { syncAllArtists } from "@/lib/platforms/artist-sync";

export const runtime = "nodejs";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ reports: await syncAllArtists() });
}
