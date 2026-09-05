import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getArtistById } from "@/lib/db";
import { ArtistEditor } from "@/components/admin/ArtistEditor";

export const dynamic = "force-dynamic";

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const artist = getArtistById(Number(id));
  if (!artist) redirect("/admin");

  return (
    <ArtistEditor
      artist={{
        id: artist.id,
        name: artist.name,
        genre: artist.genre,
        tagline: artist.tagline,
        shortBio: artist.shortBio,
        longBio: artist.longBio,
        palette: artist.palette,
        albums: artist.albums,
         songs: artist.songs.map((song) => ({
           slug: song.slug,
           title: song.title,
           releaseYear: song.releaseYear,
           type: song.type,
           album: song.album ?? "",
           coverUrl: song.coverUrl,
           previewUrl: song.previewUrl,
           isrc: song.isrc,
           links: song.links,
           platformIds: song.platformIds,
         })),
        homeImage: artist.homeImage ?? "",
        pageImage: artist.pageImage ?? "",
        backdrop: artist.backdrop ?? null,
        hoverMedia: artist.hoverMedia ?? null,
        profileLinks: {
          amazonMusic: artist.profileLinks.amazonMusic ?? "",
          youtube: artist.profileLinks.youtube ?? "",
        },
        syncSources: artist.syncSources ?? {},
        syncEnabled: artist.syncEnabled ?? false,
        lastSyncedAt: artist.lastSyncedAt ?? null,
        lastSyncAttemptAt: artist.lastSyncAttemptAt ?? null,
        syncError: artist.syncError ?? "",
      }}
    />
  );
}
