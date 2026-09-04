import { NextResponse, type NextRequest } from "next/server";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { isAdmin } from "@/lib/auth";

const execFileAsync = promisify(execFile);
const UPLOAD_DIR = path.join(
  process.env.DATA_DIR || path.join(process.cwd(), ".data"),
  "uploads",
);
const jobs = new Map<string, Promise<{ playbackUrl: string; reverseUrl: string }>>();

function uploadedFilename(src: string): string | null {
  try {
    const url = new URL(src, "http://localhost");
    const prefix = "/api/uploads/";
    if (!url.pathname.startsWith(prefix)) return null;
    const filename = decodeURIComponent(url.pathname.slice(prefix.length));
    return filename && path.basename(filename) === filename ? filename : null;
  } catch {
    return null;
  }
}

function isCloudinaryUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname.includes("res.cloudinary.com")
    );
  } catch {
    return false;
  }
}

// FFmpeg works on local files, so Cloudinary-hosted videos are downloaded
// once into the uploads dir (content-hashed name) and the derivatives are
// prepared from there.
async function fetchCloudinaryToCache(src: string): Promise<string> {
  const hash = createHash("md5").update(src).digest("hex").slice(0, 16);
  const filename = `remote-${hash}.mp4`;
  const dest = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return filename;
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error("Could not download the video from Cloudinary.");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error("Could not download the video from Cloudinary.");
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(dest, buffer);
  return filename;
}

async function createDerivative(
  inputPath: string,
  outputPath: string,
  reverse: boolean,
) {
  const filters = reverse ? ["-vf", "reverse,format=yuv420p"] : [];
  await execFileAsync(
    process.env.FFMPEG_PATH || "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      ...filters,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "22",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { windowsHide: true, maxBuffer: 1024 * 1024 },
  );
}

function prepare(filename: string): Promise<{ playbackUrl: string; reverseUrl: string }> {
  const existing = jobs.get(filename);
  if (existing) return existing;
  const job = (async () => {
    const inputPath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(inputPath)) throw new Error("The source video was not found.");
    const base = path.basename(filename, path.extname(filename));
    const playbackName = `playback-${base}.mp4`;
    const reverseName = `reverse-${base}.mp4`;
    const playbackPath = path.join(UPLOAD_DIR, playbackName);
    const reversePath = path.join(UPLOAD_DIR, reverseName);
    try {
      if (!fs.existsSync(playbackPath) || fs.statSync(playbackPath).size === 0) {
        await createDerivative(inputPath, playbackPath, false);
      }
      if (!fs.existsSync(reversePath) || fs.statSync(reversePath).size === 0) {
        await createDerivative(inputPath, reversePath, true);
      }
      return {
        playbackUrl: `/api/uploads/${playbackName}`,
        reverseUrl: `/api/uploads/${reverseName}`,
      };
    } catch (error) {
      fs.rmSync(playbackPath, { force: true });
      fs.rmSync(reversePath, { force: true });
      const message = error instanceof Error ? error.message : "FFmpeg failed.";
      if (/not found|enoent|cannot find/i.test(message)) {
        throw new Error(
          "FFmpeg is required to create smooth reverse playback. Install FFmpeg or set FFMPEG_PATH on the server.",
        );
      }
      throw new Error("Could not prepare the video for reverse playback.");
    }
  })();
  jobs.set(filename, job);
  void job.then(
    () => {
      if (jobs.get(filename) === job) jobs.delete(filename);
    },
    () => {
      if (jobs.get(filename) === job) jobs.delete(filename);
    },
  );
  return job;
}

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { src?: string };
  let filename = body.src ? uploadedFilename(body.src) : null;
  if (!filename && body.src && isCloudinaryUrl(body.src)) {
    try {
      filename = await fetchCloudinaryToCache(body.src);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Video preparation failed." },
        { status: 422 },
      );
    }
  }
  if (!filename) {
    return NextResponse.json(
      { error: "Only uploaded videos can use reverse playback." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await prepare(filename));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video preparation failed." },
      { status: 422 },
    );
  }
}
