import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getSetting, listPlaylistRows } from "@/lib/db";
import { getSpotifyConnection } from "@/lib/platforms/spotify-auth";
import { PlaylistManagerClient } from "@/components/admin/PlaylistManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminPlaylistsPage({
  searchParams,
}: {
  searchParams: Promise<{ spotify?: string; reason?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const params = await searchParams;
  const connection = getSpotifyConnection();
  return (
    <PlaylistManagerClient
      initial={listPlaylistRows()}
      initialAccounts={{
        spotify: getSetting("spotify_account_url") ?? "",
        youtube: getSetting("youtube_account_url") ?? "",
        apple: getSetting("apple_account_url") ?? "",
        amazon: getSetting("amazon_account_url") ?? "",
      }}
      spotifyStatus={
        connection.connected
          ? { userName: connection.userName, userId: connection.userId }
          : null
      }
      spotifyNotice={
        params.spotify === "connected"
          ? "Spotify account connected."
          : params.spotify === "error"
            ? (params.reason ?? "Spotify connection failed.")
            : null
      }
    />
  );
}
