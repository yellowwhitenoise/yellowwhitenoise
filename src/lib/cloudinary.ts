import { createHash } from "node:crypto";

function signParams(params: Record<string, string>, apiSecret: string): string {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(base + apiSecret).digest("hex");
}

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl) {
    try {
      const parsed = new URL(cloudinaryUrl);
      return {
        cloudName: parsed.hostname,
        apiKey: decodeURIComponent(parsed.username),
        apiSecret: decodeURIComponent(parsed.password),
        folder: process.env.CLOUDINARY_FOLDER || "ywn",
      };
    } catch {
      return null;
    }
  }
  if (!cloudName || !apiKey || !apiSecret) return null;
  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: process.env.CLOUDINARY_FOLDER || "ywn",
  };
}

export function isCloudinaryConfigured(): boolean {
  return config() !== null;
}

export function cloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("res.cloudinary.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    const after = parts.slice(uploadIndex + 1);
    const start = after[0]?.startsWith("v") ? 1 : 0;
    const filename = after.slice(start).join("/");
    return filename.replace(/\.[a-z0-9]+$/i, "") || null;
  } catch {
    return null;
  }
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  mime: string,
): Promise<{ url: string; publicId: string; bytes: number }> {
  const cfg = config();
  if (!cfg) throw new Error("Cloudinary is not configured.");
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${cfg.folder}/${Date.now().toString(36)}-${createHash("md5").update(filename + timestamp).digest("hex").slice(0, 8)}`;
  // Note: api_key is sent as a form field but must NOT be part of the
  // signed string — Cloudinary signs only the remaining parameters.
  const params: Record<string, string> = {
    folder: cfg.folder,
    public_id: publicId,
    timestamp: String(timestamp),
  };
  const signature = signParams(params, cfg.apiSecret);
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mime }), filename);
  form.append("api_key", cfg.apiKey);
  form.append("timestamp", params.timestamp);
  form.append("folder", params.folder);
  form.append("public_id", params.public_id);
  form.append("signature", signature);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`,
    { method: "POST", body: form },
  );
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(
      `Cloudinary upload failed (${response.status}). ${detail}`,
    );
  }
  const data = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    bytes?: number;
  };
  if (!data.secure_url || !data.public_id) {
    throw new Error("Cloudinary upload failed.");
  }
  return {
    url: data.secure_url,
    publicId: data.public_id,
    bytes: data.bytes ?? buffer.length,
  };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cfg = config();
  if (!cfg) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams(
    { public_id: publicId, timestamp: String(timestamp) },
    cfg.apiSecret,
  );
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", cfg.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`,
    { method: "POST", body: form },
  ).catch(() => undefined);
}
