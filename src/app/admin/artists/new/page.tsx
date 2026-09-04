import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { ArtistEditor } from "@/components/admin/ArtistEditor";

export const dynamic = "force-dynamic";

export default async function NewArtistPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <ArtistEditor
      artist={{
        name: "",
        genre: "",
        tagline: "",
        shortBio: "",
        longBio: "",
        palette: { from: "#2a3f4d", to: "#101b23" },
        albums: [],
        songs: [{ title: "", releaseYear: "", type: "single", album: "" }],
        homeImage: "",
        pageImage: "",
        backdrop: null,
        hoverMedia: null,
        syncSources: {},
        syncEnabled: false,
        lastSyncedAt: null,
        lastSyncAttemptAt: null,
        syncError: "",
      }}
    />
  );
}
