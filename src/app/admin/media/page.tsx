import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getSetting, listMedia } from "@/lib/db";
import { MediaLibraryClient } from "@/components/admin/MediaLibraryClient";
import type { MediaRef } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  let backdrop: MediaRef | null = null;
  const raw = getSetting("home_backdrop");
  if (raw) {
    try {
      const value = JSON.parse(raw) as unknown;
      if (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        "src" in value &&
        (value.type === "image" || value.type === "video") &&
        typeof value.src === "string"
      ) {
        backdrop = value as MediaRef;
      }
    } catch {
      backdrop = null;
    }
  }
  return (
    <MediaLibraryClient initial={listMedia()} initialBackdrop={backdrop} />
  );
}
