import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { syncArtistById } from "@/lib/platforms/artist-sync";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const report = await syncArtistById(Number(id));
  if (!report) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ report });
}
