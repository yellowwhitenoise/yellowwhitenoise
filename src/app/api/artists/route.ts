import { NextResponse } from "next/server";
import { listArtists } from "@/lib/db";

export async function GET() {
  return NextResponse.json(listArtists());
}
