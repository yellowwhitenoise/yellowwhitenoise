import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { listPlaylistRows } from "@/lib/db";
import {
  syncAllPlaylists,
  syncPlaylistById,
} from "@/lib/platforms/playlist-sync";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    id?: unknown;
  };
  if (typeof body.id === "number" && Number.isInteger(body.id)) {
    const report = await syncPlaylistById(body.id);
    if (!report) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ reports: [report], rows: listPlaylistRows() });
  }
  return NextResponse.json({
    reports: await syncAllPlaylists(),
    rows: listPlaylistRows(),
  });
}
