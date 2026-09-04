import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  countPushSubscriptions,
  countSubscribers,
  getNotificationsEnabled,
  getSetting,
  listAllPosts,
  listArtists,
} from "@/lib/db";
import { DashboardClient } from "@/components/admin/DashboardClient";
import type { MediaRef } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { status } = await searchParams;
  const active = ["all", "published", "draft", "scheduled"].includes(
    status ?? "",
  )
    ? (status as string)
    : "all";

  let homeBackdrop: MediaRef | null = null;
  const raw = getSetting("home_backdrop");
  if (raw) {
    try {
      homeBackdrop = JSON.parse(raw) as MediaRef;
    } catch {
      homeBackdrop = null;
    }
  }

  const posts = listAllPosts()
    .filter((post) => active === "all" || post.status === active)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status,
      date: row.date,
      updated_at: row.updated_at,
    }));

  const artists = listArtists().map((artist) => ({
    id: artist.id,
    slug: artist.slug,
    name: artist.name,
    genre: artist.genre,
    songsCount: artist.songs.length,
    hoverBackdropEnabled: artist.hoverBackdropEnabled !== false,
  }));

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-20 pt-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] opacity-50">
            Yellow White Noise
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold uppercase tracking-[0.1em]">
            Dashboard
          </h1>
        </div>
      </div>

      <DashboardClient
        posts={posts}
        artists={artists}
        activeFilter={active}
        subscriberCount={countSubscribers()}
        pushSubscriberCount={countPushSubscriptions()}
        notificationsEnabled={getNotificationsEnabled()}
        homeBackdrop={homeBackdrop}
      />
    </main>
  );
}
