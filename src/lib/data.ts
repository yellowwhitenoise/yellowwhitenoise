export type Platform = "spotify" | "appleMusic" | "youtubeMusic";

export const platformLabels: Record<Platform, string> = {
  spotify: "Spotify",
  appleMusic: "Apple Music",
  youtubeMusic: "YouTube Music",
};

export const platformHomeUrls: Record<Platform, string> = {
  spotify: "https://open.spotify.com/",
  appleMusic: "https://music.apple.com/",
  youtubeMusic: "https://music.youtube.com/",
};

export interface ArtistPalette {
  from: string;
  to: string;
}

export interface MediaRef {
  type: "video" | "image";
  src: string;
  loopBackwards?: boolean;
  playbackSrc?: string;
  reverseSrc?: string;
}

export interface Song {
  slug: string;
  title: string;
  artistName: string;
  releaseYear: string;
  type: "single" | "album-track" | "remix";
  album?: string;
  coverUrl?: string;
  links: Record<Platform, string>;
  previewUrl?: string;
  isrc?: string;
  platformIds?: Partial<Record<Platform, string>>;
}

export interface Album {
  title: string;
  links: Record<Platform, string>;
  isrc?: string;
  platformIds?: Partial<Record<Platform, string>>;
}

export interface Artist {
  slug: string;
  name: string;
  genre: string;
  tagline: string;
  shortBio: string;
  longBio: string;
  albums: Album[];
  heroMedia?: MediaRef;
  palette: ArtistPalette;
  profileLinks: Record<Platform, string> & { youtube?: string };
  songs: Song[];
  homeImage?: string;
  pageImage?: string;
  backdrop?: MediaRef;
  hoverMedia?: MediaRef;
  hoverBackdropEnabled?: boolean;
  syncSources?: Partial<Record<Platform, string>>;
  syncEnabled?: boolean;
  lastSyncedAt?: string;
  lastSyncAttemptAt?: string;
  syncError?: string;
}

export interface OutsideTrack {
  title: string;
  artistName: string;
  spotifyUrl?: string;
}

export interface PlaylistTrack {
  title: string;
  artistName: string;
  links: Partial<Record<Platform, string>>;
  albumName?: string;
  previewUrl?: string;
  coverUrl?: string;
  durationMs?: number;
}

export type PlaylistEntry =
  | { kind: "label"; songSlug: string }
  | { kind: "outside"; track: OutsideTrack }
  | { kind: "track"; track: PlaylistTrack };

export interface Playlist {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  coverPalette: ArtistPalette;
  coverUrl?: string;
  links: Record<Platform, string>;
  availableLinks?: Partial<Record<Platform, string>>;
  ogDescription?: string;
  ogImageUrl?: string;
  entries: PlaylistEntry[];
}

export const playlists: Playlist[] = [
  {
    slug: "yellow-hours",
    name: "Yellow Hours",
    tagline:
      "Late-night Amapiano for the after-hours — slow, deep, and patient.",
    description:
      "Yellow Hours is the sound of 2AM and after — a slow-burning selection where Muddledsea's log-drum meditations sit beside the Amapiano records we keep on repeat. Expect patient builds, sub-heavy lows, and space for the night to breathe. Best experienced end to end, lights low.",
    coverPalette: { from: "#2a3f4d", to: "#101b23" },
    links: { ...platformHomeUrls },
    entries: [
      { kind: "label", songSlug: "low-tide-gospel" },
      {
        kind: "outside",
        track: { title: "Mnike", artistName: "Tyler ICU & Tumelo_za" },
      },
      { kind: "label", songSlug: "log-drum-lullaby" },
      { kind: "outside", track: { title: "Water", artistName: "Tyla" } },
      { kind: "label", songSlug: "3am-shaker" },
      {
        kind: "outside",
        track: { title: "Sgubu Se Monati", artistName: "SjavasDaDeejay" },
      },
      { kind: "label", songSlug: "patient-ghost" },
    ],
  },
  {
    slug: "voltage-nights",
    name: "Voltage Nights",
    tagline: "High-voltage Afrobeats for the peak of the night.",
    description:
      "Voltage Nights is pure momentum — Coaltonic's club-built percussion wired into the Afrobeats records that never leave rotation. Syncopated drums, crowd-ready hooks, and energy that only goes one direction: up. Press play and keep moving.",
    coverPalette: { from: "#5a3a14", to: "#20140a" },
    links: { ...platformHomeUrls },
    entries: [
      { kind: "label", songSlug: "static-gbedu" },
      { kind: "outside", track: { title: "Calm Down", artistName: "Rema" } },
      { kind: "label", songSlug: "crowd-theory" },
      {
        kind: "outside",
        track: { title: "Last Last", artistName: "Burna Boy" },
      },
      { kind: "label", songSlug: "sweet-menace" },
      { kind: "outside", track: { title: "Rush", artistName: "Ayra Starr" } },
      { kind: "label", songSlug: "bata-bounce" },
    ],
  },
];

export function getPlaylist(slug: string): Playlist | undefined {
  return playlists.find((playlist) => playlist.slug === slug);
}
