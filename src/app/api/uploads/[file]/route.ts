import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const UPLOAD_DIR = path.join(
  process.env.DATA_DIR || path.join(process.cwd(), ".data"),
  "uploads",
);

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".ts": "video/mp2t",
  ".mkv": "video/x-matroska",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const safe = path.basename(file);
  const full = path.join(UPLOAD_DIR, safe);
  if (!fs.existsSync(full)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const type = TYPES[path.extname(safe).toLowerCase()] ?? "application/octet-stream";
  const data = fs.readFileSync(full);
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(download
        ? {
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safe)}`,
          }
        : {}),
    },
  });
}
