import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { addMedia } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const UPLOAD_DIR = path.join(
  process.env.DATA_DIR || path.join(process.cwd(), ".data"),
  "uploads",
);
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 200 * 1024 * 1024;
const ALLOWED: Record<string, { ext: string; kind: string }> = {
  "image/jpeg": { ext: ".jpg", kind: "image" },
  "image/png": { ext: ".png", kind: "image" },
  "image/webp": { ext: ".webp", kind: "image" },
  "image/gif": { ext: ".gif", kind: "image" },
  "image/avif": { ext: ".avif", kind: "image" },
  "video/mp4": { ext: ".mp4", kind: "video" },
  "video/webm": { ext: ".webm", kind: "video" },
  "video/quicktime": { ext: ".mov", kind: "video" },
  "video/mp2t": { ext: ".ts", kind: "video" },
  "video/x-matroska": { ext: ".mkv", kind: "video" },
};

const EXT_LOOKUP: Record<string, { mime: string; ext: string; kind: string }> =
  {};
for (const [mime, config] of Object.entries(ALLOWED)) {
  EXT_LOOKUP[config.ext] = { mime, ...config };
}

function resolveFile(file: File) {
  return ALLOWED[file.type] ?? EXT_LOOKUP[path.extname(file.name).toLowerCase()];
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const allowed = resolveFile(file);
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Use images (JPEG, PNG, WebP, GIF, AVIF) or videos (MP4, WebM, MOV, TS, MKV).",
      },
      { status: 400 },
    );
  }
  const limit = allowed.kind === "video" ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > limit) {
    return NextResponse.json(
      { error: `File must be under ${Math.round(limit / (1024 * 1024))} MB.` },
      { status: 400 },
    );
  }
  const width = Number(form?.get("width")) || null;
  const height = Number(form?.get("height")) || null;
  const duration = Number(form?.get("duration")) || null;
  const title = String(form?.get("title") ?? "");
  const caption = String(form?.get("caption") ?? "");
  const buffer = Buffer.from(await file.arrayBuffer());

  const { isCloudinaryConfigured, uploadToCloudinary } = await import(
    "@/lib/cloudinary"
  );
  if (isCloudinaryConfigured()) {
    try {
      const uploaded = await uploadToCloudinary(
        buffer,
        file.name || `upload${allowed.ext}`,
        file.type || "application/octet-stream",
      );
      const media = addMedia({
        filename: uploaded.publicId,
        url: uploaded.url,
        kind: allowed.kind,
        mime: file.type,
        size: uploaded.bytes,
        width,
        height,
        duration,
        title,
        caption,
      });
      return NextResponse.json({
        url: media.url,
        id: media.id,
        kind: media.kind,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Cloudinary upload failed.",
        },
        { status: 502 },
      );
    }
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}${allowed.ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);

  const media = addMedia({
    filename: name,
    url: `/api/uploads/${name}`,
    kind: allowed.kind,
    mime: file.type,
    size: file.size,
    width,
    height,
    duration,
    title,
    caption,
  });

  return NextResponse.json({ url: media.url, id: media.id, kind: media.kind });
}
