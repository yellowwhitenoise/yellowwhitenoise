import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteMedia, getMediaById, listMedia } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const kind = request.nextUrl.searchParams.get("kind") ?? undefined;
  return NextResponse.json(listMedia(kind));
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const entry = getMediaById(id);
  deleteMedia(id);
  if (entry && entry.url.includes("res.cloudinary.com")) {
    const { cloudinaryPublicIdFromUrl, deleteFromCloudinary } = await import(
      "@/lib/cloudinary"
    );
    const publicId =
      cloudinaryPublicIdFromUrl(entry.url) ?? entry.filename;
    if (publicId.includes("/")) {
      await deleteFromCloudinary(publicId);
    }
  }
  return NextResponse.json({ ok: true });
}
