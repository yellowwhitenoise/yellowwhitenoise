import { NextResponse, type NextRequest } from "next/server";
import { syncAllPlaylists } from "@/lib/platforms/playlist-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503, headers: NO_STORE },
    );
  }
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: NO_STORE },
    );
  }
  return NextResponse.json({ reports: await syncAllPlaylists() }, { headers: NO_STORE });
}
