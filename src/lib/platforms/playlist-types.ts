import type { PlaylistTrack, Platform } from "@/lib/data";

export interface ImportedPlaylist {
  name: string;
  description: string;
  coverUrl?: string;
  platform: Platform;
  sourceId: string;
  tracks: PlaylistTrack[];
}
