import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { SettingsClient } from "@/components/admin/SettingsClient";
import {
  getArtistSyncMinutes,
  getHapticsEnabled,
  getPlaylistSyncMinutes,
} from "@/lib/sync-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <SettingsClient
      initialPlaylistMinutes={getPlaylistSyncMinutes()}
      initialArtistMinutes={getArtistSyncMinutes()}
      initialHaptics={getHapticsEnabled()}
    />
  );
}
