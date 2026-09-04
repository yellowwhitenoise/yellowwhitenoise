import type { Platform } from "@/lib/data";

export interface ImportedArtistAlbum {
  title: string;
  releaseYear: string;
  links: Partial<Record<Platform, string>>;
  isrc?: string;
  platformIds?: Partial<Record<Platform, string>>;
}

export interface ImportedArtistSong {
  title: string;
  artistName: string;
  releaseYear: string;
  type: "single" | "album-track" | "remix";
  album?: string;
  coverUrl?: string;
  links: Partial<Record<Platform, string>>;
  previewUrl?: string;
  isrc?: string;
  platformIds?: Partial<Record<Platform, string>>;
}

export interface ImportedArtistCatalog {
  albums: ImportedArtistAlbum[];
  songs: ImportedArtistSong[];
}

export type ArtistSyncSources = Partial<Record<Platform, string>>;
