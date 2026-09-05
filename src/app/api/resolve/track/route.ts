import { NextResponse, type NextRequest } from "next/server";
import { resolveTrack } from "@/lib/platforms/resolve";

export async function GET(request: NextRequest) {
  const title = (request.nextUrl.searchParams.get("title") ?? "")
    .trim()
    .slice(0, 200);
  const artist = (request.nextUrl.searchParams.get("artist") ?? "")
    .trim()
    .slice(0, 200);
  if (!title || !artist) {
    return NextResponse.json(
      { error: "title and artist query params are required" },
      { status: 400 },
    );
  }
  const result = await resolveTrack(title, artist);
  return NextResponse.json(result);
}
