import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { seedPosts as seedInitialPosts } from "@/lib/blog-seed";
import {
  playlists as seedPlaylists,
  platformHomeUrls,
  type Album,
  type Artist,
  type MediaRef,
  type Playlist,
  type PlaylistTrack,
  type Platform,
  type Song,
} from "@/lib/data";

export interface BlogPostRow {
  id: number;
  slug: string;
  title: string;
  brief: string;
  date: string;
  hero_image: string | null;
  body: string;
  status: "draft" | "published" | "scheduled";
  excerpt: string;
  featured_image: string | null;
  category: string;
  tags: string;
  author: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  primary_keyword: string;
  secondary_keywords: string;
  search_intent: string;
  article_summary: string;
  key_takeaways: string;
  direct_answer: string;
  key_facts: string;
  entities: string;
  topics: string;
  editorial_perspective: string;
  faq: string;
  sources: string;
  author_title: string;
  author_bio: string;
  author_image: string | null;
  author_links: string;
  image_alt: string;
  related_slugs: string;
  materially_updated_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriberRow {
  id: number;
  email: string;
  status: "active" | "unsubscribed";
  global_updates: number;
  unsubscribed_at: string | null;
  created_at: string;
  playlist_count: number;
}

const DATA_DIR =
  process.env.DATA_DIR || path.join(process.cwd(), ".data");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(path.join(DATA_DIR, "ywn.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      global_updates INTEGER NOT NULL DEFAULT 1,
      unsubscribed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      brief TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      hero_image TEXT,
      body TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      cover_url TEXT,
      cover_palette_from TEXT NOT NULL DEFAULT '#2a3f4d',
      cover_palette_to TEXT NOT NULL DEFAULT '#101b23',
      links TEXT NOT NULL DEFAULT '{}',
      entries TEXT NOT NULL DEFAULT '[]',
      track_link_mode TEXT NOT NULL DEFAULT 'song',
      source_platform TEXT NOT NULL DEFAULT '',
      source_id TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL DEFAULT '',
      visible INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      last_sync_attempt_at TEXT,
      sync_error TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      genre TEXT NOT NULL DEFAULT '',
      tagline TEXT NOT NULL DEFAULT '',
      short_bio TEXT NOT NULL DEFAULT '',
      long_bio TEXT NOT NULL DEFAULT '',
      albums TEXT NOT NULL DEFAULT '[]',
      palette_from TEXT NOT NULL DEFAULT '#2a3f4d',
      palette_to TEXT NOT NULL DEFAULT '#101b23',
      profile_links TEXT NOT NULL DEFAULT '{}',
      songs TEXT NOT NULL DEFAULT '[]',
      hover_backdrop_enabled INTEGER NOT NULL DEFAULT 1,
      sync_sources TEXT NOT NULL DEFAULT '{}',
      sync_enabled INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      last_sync_attempt_at TEXT,
      sync_error TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'image',
      mime TEXT NOT NULL DEFAULT '',
      size INTEGER NOT NULL DEFAULT 0,
      width INTEGER,
      height INTEGER,
      duration REAL,
      title TEXT NOT NULL DEFAULT '',
      caption TEXT NOT NULL DEFAULT '',
      uploaded_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ad_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      advertiser TEXT NOT NULL DEFAULT '',
      creative_type TEXT NOT NULL DEFAULT 'html',
      creative_html TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      link_url TEXT NOT NULL DEFAULT '',
      alt TEXT NOT NULL DEFAULT '',
      slots TEXT NOT NULL DEFAULT '[]',
      targeting TEXT NOT NULL DEFAULT '{}',
      priority INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS app_cache (
      cache_key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS playlist_track_events (
      playlist_slug TEXT NOT NULL,
      track_key TEXT NOT NULL,
      title TEXT NOT NULL,
      artist_name TEXT NOT NULL DEFAULT '',
      track_url TEXT NOT NULL DEFAULT '',
      detected_at TEXT DEFAULT (datetime('now')),
      notified_at TEXT,
      PRIMARY KEY (playlist_slug, track_key)
    );
    CREATE TABLE IF NOT EXISTS playlist_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscriber_id INTEGER NOT NULL,
      playlist_slug TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE (subscriber_id, playlist_slug)
    );
    CREATE TABLE IF NOT EXISTS artist_release_events (
      artist_slug TEXT NOT NULL,
      release_key TEXT NOT NULL,
      release_type TEXT NOT NULL,
      title TEXT NOT NULL,
      artist_name TEXT NOT NULL DEFAULT '',
      album_name TEXT NOT NULL DEFAULT '',
      release_url TEXT NOT NULL DEFAULT '',
      detected_at TEXT DEFAULT (datetime('now')),
      notified_at TEXT,
      PRIMARY KEY (artist_slug, release_key)
    );
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL DEFAULT '',
      auth TEXT NOT NULL DEFAULT '',
      playlists TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  migratePostsTable(db);
  migratePlaylistsTable(db);
  migrateSubscribersTable(db);
  seedPostsTable(db);
  seedArtistsTable(db);
  seedPlaylistsTable(db);
  return db;
}

function seedPlaylistsTable(database: Database.Database) {
  const count = database
    .prepare("SELECT COUNT(*) AS count FROM playlists")
    .get() as { count: number };
  if (count.count > 0) return;
  const songsBySlug = new Map<
    string,
    { title: string; artistName: string; links: Partial<Record<Platform, string>> }
  >();
  try {
    const artistRows = database
      .prepare("SELECT songs FROM artists")
      .all() as { songs: string }[];
    for (const row of artistRows) {
      try {
        const songs = JSON.parse(row.songs) as {
          slug: string;
          title: string;
          artistName: string;
          links: Partial<Record<Platform, string>>;
        }[];
        for (const song of songs) {
          if (song?.slug) songsBySlug.set(song.slug, song);
        }
      } catch {
        // skip malformed artist songs
      }
    }
  } catch {
    // artists table unavailable; label tracks fall back to their slugs
  }
  let sortOrder = 0;
  for (const seed of seedPlaylists) {
    const tracks: PlaylistTrack[] = seed.entries.map((entry) => {
      if (entry.kind === "label") {
        const song = songsBySlug.get(entry.songSlug);
        if (song) {
          return {
            title: song.title,
            artistName: song.artistName,
            links: { ...song.links },
          };
        }
        return { title: entry.songSlug, artistName: "", links: {} };
      }
      if (entry.kind === "outside") {
        return {
          title: entry.track.title,
          artistName: entry.track.artistName,
          links: entry.track.spotifyUrl
            ? { spotify: entry.track.spotifyUrl }
            : {},
        };
      }
      return {
        title: entry.track.title,
        artistName: entry.track.artistName,
        links: { ...entry.track.links },
      };
    });
    createPlaylist({
      name: seed.name,
      tagline: seed.tagline,
      description: seed.description,
      coverUrl: seed.coverUrl ?? null,
      coverPaletteFrom: seed.coverPalette.from,
      coverPaletteTo: seed.coverPalette.to,
      links: { ...seed.links },
      entries: tracks,
      sourcePlatform: "spotify",
      sourceId: `seed-${seed.slug}`,
      sourceUrl: "",
      visible: true,
      sortOrder: sortOrder++,
    });
  }
}

function migratePlaylistsTable(database: Database.Database) {
  const columns: [string, string][] = [
    ["last_synced_at", "TEXT"],
    ["last_sync_attempt_at", "TEXT"],
    ["sync_error", "TEXT NOT NULL DEFAULT ''"],
    ["track_link_mode", "TEXT NOT NULL DEFAULT 'song'"],
  ];
  for (const [name, definition] of columns) {
    try {
      database.exec(`ALTER TABLE playlists ADD COLUMN ${name} ${definition}`);
    } catch {
      // column already exists
    }
  }
}

function migrateSubscribersTable(database: Database.Database) {
  const columns: [string, string][] = [
    ["status", "TEXT NOT NULL DEFAULT 'active'"],
    ["global_updates", "INTEGER NOT NULL DEFAULT 1"],
    ["unsubscribed_at", "TEXT"],
  ];
  for (const [name, definition] of columns) {
    try {
      database.exec(`ALTER TABLE subscribers ADD COLUMN ${name} ${definition}`);
    } catch {
      // column already exists
    }
  }
}

function migratePostsTable(database: Database.Database) {
  const columns: [string, string][] = [
    ["excerpt", "TEXT NOT NULL DEFAULT ''"],
    ["featured_image", "TEXT"],
    ["category", "TEXT NOT NULL DEFAULT ''"],
    ["tags", "TEXT NOT NULL DEFAULT '[]'"],
    ["author", "TEXT NOT NULL DEFAULT 'Yellow White Noise'"],
    ["published_at", "TEXT"],
    ["seo_title", "TEXT"],
    ["seo_description", "TEXT"],
    ["primary_keyword", "TEXT NOT NULL DEFAULT ''"],
    ["secondary_keywords", "TEXT NOT NULL DEFAULT '[]'"],
    ["search_intent", "TEXT NOT NULL DEFAULT ''"],
    ["article_summary", "TEXT NOT NULL DEFAULT ''"],
    ["key_takeaways", "TEXT NOT NULL DEFAULT '[]'"],
    ["direct_answer", "TEXT NOT NULL DEFAULT ''"],
    ["key_facts", "TEXT NOT NULL DEFAULT '[]'"],
    ["entities", "TEXT NOT NULL DEFAULT '[]'"],
    ["topics", "TEXT NOT NULL DEFAULT '[]'"],
    ["editorial_perspective", "TEXT NOT NULL DEFAULT ''"],
    ["faq", "TEXT NOT NULL DEFAULT '[]'"],
    ["sources", "TEXT NOT NULL DEFAULT '[]'"],
    ["author_title", "TEXT NOT NULL DEFAULT ''"],
    ["author_bio", "TEXT NOT NULL DEFAULT ''"],
    ["author_image", "TEXT"],
    ["author_links", "TEXT NOT NULL DEFAULT '[]'"],
    ["image_alt", "TEXT NOT NULL DEFAULT ''"],
    ["related_slugs", "TEXT NOT NULL DEFAULT '[]'"],
    ["materially_updated_at", "TEXT"],
    ["reviewed_at", "TEXT"],
  ];
  for (const [name, definition] of columns) {
    try {
      database.exec(`ALTER TABLE posts ADD COLUMN ${name} ${definition}`);
    } catch {
      // column already exists
    }
  }
  database.exec(
    `UPDATE posts SET author_links = '[]' WHERE author_links = '{}'`,
  );
  const artistColumns: [string, string][] = [
    ["home_image", "TEXT"],
    ["page_image", "TEXT"],
    ["backdrop", "TEXT"],
    ["hover_media", "TEXT"],
    ["hover_backdrop_enabled", "INTEGER NOT NULL DEFAULT 1"],
    ["sync_sources", "TEXT NOT NULL DEFAULT '{}'"],
    ["sync_enabled", "INTEGER NOT NULL DEFAULT 0"],
    ["last_synced_at", "TEXT"],
    ["last_sync_attempt_at", "TEXT"],
    ["sync_error", "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [name, definition] of artistColumns) {
    try {
      database.exec(`ALTER TABLE artists ADD COLUMN ${name} ${definition}`);
    } catch {
      // column already exists
    }
  }
}

const seedArtistData: {
  slug: string;
  name: string;
  genre: string;
  tagline: string;
  shortBio: string;
  longBio: string;
  albums: Album[];
  palette: { from: string; to: string };
  songs: Song[];
}[] = [
  {
    slug: "muddledsea",
    name: "Muddledsea",
    genre: "Amapiano",
    tagline: "Amapiano, after hours",
    shortBio:
      "Amapiano for the hours after the party — patient, sub-heavy instrumentals built for headphones as much as dance floors.",
    longBio:
      "Muddledsea operates in the quiet stretch of the night — the after-after, the empty road, the hour when the log drum stops being a sound and becomes a pulse. Working almost entirely in instrumental form, the project treats Amapiano not as a template but as a weather system: slow-moving, humid, impossible to rush. Each record is built the way the genre's best moments always have been — one hypnotic figure, space left deliberately open, bass that arrives less like a drop and more like a tide.\n\nThe name is the mission statement. Muddledsea's records sit on purpose between clarity and blur — shakers crisp, keys half-remembered, low end felt before it is heard. It is music made for late-night headphone sessions and long drives, tuned with enough patience and weight to hold a floor of its own when given the chance.",
    albums: [{ title: "Tide Tables", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } }, { title: "Lowlight Dubs", kind: "ep", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } }],
    palette: { from: "#2a3f4d", to: "#101b23" },
    songs: [
      { slug: "low-tide-gospel", title: "Low Tide Gospel", artistName: "Muddledsea", releaseYear: "2026", type: "single", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "log-drum-lullaby", title: "Log Drum Lullaby", artistName: "Muddledsea", releaseYear: "2026", type: "single", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "3am-shaker", title: "3AM Shaker", artistName: "Muddledsea", releaseYear: "2025", type: "single", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "fog-in-the-keys", title: "Fog in the Keys", artistName: "Muddledsea", releaseYear: "2025", type: "album-track", album: "Tide Tables", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "patient-ghost", title: "Patient Ghost", artistName: "Muddledsea", releaseYear: "2025", type: "single", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "lowlight-dub", title: "Lowlight Dub", artistName: "Muddledsea", releaseYear: "2026", type: "album-track", album: "Lowlight Dubs", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "shaker-study", title: "Shaker Study", artistName: "Muddledsea", releaseYear: "2026", type: "album-track", album: "Lowlight Dubs", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "night-bus-reprise", title: "Night Bus Reprise", artistName: "Muddledsea", releaseYear: "2025", type: "album-track", album: "Lowlight Dubs", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
    ],
  },
  {
    slug: "coaltonic",
    name: "Coaltonic",
    genre: "Afrobeats",
    tagline: "Afrobeats in motion",
    shortBio:
      "Afrobeats engineered for movement — syncopated, sweat-slick rhythm stacks tuned to keep a crowd in motion.",
    longBio:
      "Coaltonic makes instrumental Afrobeats with the engine of a live band and the finish of a club system. The records run on rhythm stacks — log-toned percussion, bata patterns cut with electronic ticks, basslines that move like they are dodging something — arranged so every eight bars hands the energy to someone new on the dancefloor. Nothing sits still; even the breakdowns are written like a run-up.\n\nUnder the pace sits a producer's patience. Coaltonic builds tracks in layers, giving each percussion element its own pocket and tuning the mix so a phone speaker sounds full and a club system sounds dangerous. The crowd is treated as the final instrument — music that never asks for movement, only makes standing still the harder option.",
    albums: [{ title: "Night Market", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } }, { title: "Streetlight Riddims", kind: "ep", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } }],
    palette: { from: "#5a3a14", to: "#20140a" },
    songs: [
      { slug: "static-gbedu", title: "Static Gbedu", artistName: "Coaltonic", releaseYear: "2026", type: "single", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "crowd-theory", title: "Crowd Theory", artistName: "Coaltonic", releaseYear: "2026", type: "single", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "pace-setter", title: "Pace Setter", artistName: "Coaltonic", releaseYear: "2025", type: "album-track", album: "Night Market", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "bata-bounce", title: "Bata Bounce", artistName: "Coaltonic", releaseYear: "2025", type: "single", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "sweet-menace", title: "Sweet Menace", artistName: "Coaltonic", releaseYear: "2025", type: "single", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "streetlight-riddim", title: "Streetlight Riddim", artistName: "Coaltonic", releaseYear: "2026", type: "album-track", album: "Streetlight Riddims", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "gutter-anthem", title: "Gutter Anthem", artistName: "Coaltonic", releaseYear: "2026", type: "album-track", album: "Streetlight Riddims", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
      { slug: "last-bus-home", title: "Last Bus Home", artistName: "Coaltonic", releaseYear: "2025", type: "album-track", album: "Streetlight Riddims", links: { spotify: "https://open.spotify.com/", appleMusic: "https://music.apple.com/", amazonMusic: "https://music.amazon.com/", youtubeMusic: "https://music.youtube.com/" } },
    ],
  },
];

function seedArtistsTable(database: Database.Database) {
  const count = database
    .prepare("SELECT COUNT(*) AS count FROM artists")
    .get() as { count: number };
  if (count.count > 0) return;
  const insert = database.prepare(
    `INSERT INTO artists (slug, name, genre, tagline, short_bio, long_bio, albums, palette_from, palette_to, profile_links, songs)
     VALUES (@slug, @name, @genre, @tagline, @short_bio, @long_bio, @albums, @palette_from, @palette_to, @profile_links, @songs)`,
  );
  for (const artist of seedArtistData) {
    insert.run({
      slug: artist.slug,
      name: artist.name,
      genre: artist.genre,
      tagline: artist.tagline,
      short_bio: artist.shortBio,
      long_bio: artist.longBio,
      albums: JSON.stringify(artist.albums),
      palette_from: artist.palette.from,
      palette_to: artist.palette.to,
      profile_links: JSON.stringify({
        spotify: "https://open.spotify.com/",
        appleMusic: "https://music.apple.com/",
        youtubeMusic: "https://music.youtube.com/",
      }),
      songs: JSON.stringify(artist.songs),
    });
  }
}

export interface ArtistRow {
  id: number;
  slug: string;
  name: string;
  genre: string;
  tagline: string;
  short_bio: string;
  long_bio: string;
  albums: string;
  palette_from: string;
  palette_to: string;
  profile_links: string;
  songs: string;
  home_image: string | null;
  page_image: string | null;
  backdrop: string | null;
  hover_media: string | null;
  hover_backdrop_enabled: number;
  sync_sources: string;
  sync_enabled: number;
  last_synced_at: string | null;
  last_sync_attempt_at: string | null;
  sync_error: string;
  created_at: string;
}

export function rowToArtist(row: ArtistRow): Artist & { id: number } {
  let albums: Album[] = [];
  let songs: Song[] = [];
  let profileLinks: Record<string, string> = {};
  let syncSources: Record<string, string> = {};
  let backdrop: MediaRef | undefined;
  let hoverMedia: MediaRef | undefined;
  try {
    albums = JSON.parse(row.albums) as Album[];
  } catch {
    albums = [];
  }
  try {
    songs = JSON.parse(row.songs) as Song[];
  } catch {
    songs = [];
  }
  // Older rows predate Amazon Music — backfill so every links object is complete.
  const withAmazon = <T extends { links?: Partial<Record<string, string>> }>(
    entry: T,
  ): T => ({
    ...entry,
    links: {
      amazonMusic: "https://music.amazon.com/",
      ...entry.links,
    },
  });
  albums = albums.map(withAmazon);
  songs = songs.map(withAmazon);
  try {
    profileLinks = JSON.parse(row.profile_links) as Record<string, string>;
  } catch {
    profileLinks = {};
  }
  try {
    syncSources = JSON.parse(row.sync_sources) as Record<string, string>;
  } catch {
    syncSources = {};
  }
  try {
    backdrop = row.backdrop ? (JSON.parse(row.backdrop) as MediaRef) : undefined;
  } catch {
    backdrop = undefined;
  }
  try {
    hoverMedia = row.hover_media
      ? (JSON.parse(row.hover_media) as MediaRef)
      : undefined;
  } catch {
    hoverMedia = undefined;
  }
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    genre: row.genre,
    tagline: row.tagline,
    shortBio: row.short_bio,
    longBio: row.long_bio,
    albums,
    palette: { from: row.palette_from, to: row.palette_to },
    profileLinks: {
      spotify: profileLinks.spotify ?? "https://open.spotify.com/",
      appleMusic: profileLinks.appleMusic ?? "https://music.apple.com/",
      amazonMusic: profileLinks.amazonMusic || "https://music.amazon.com/",
      youtubeMusic: profileLinks.youtubeMusic ?? "https://music.youtube.com/",
      youtube: profileLinks.youtube || "https://www.youtube.com/",
    },
    songs,
    homeImage: row.home_image ?? undefined,
    pageImage: row.page_image ?? undefined,
    backdrop,
    hoverMedia,
    hoverBackdropEnabled: row.hover_backdrop_enabled !== 0,
    syncSources,
    syncEnabled: row.sync_enabled === 1,
    lastSyncedAt: row.last_synced_at ?? undefined,
    lastSyncAttemptAt: row.last_sync_attempt_at ?? undefined,
    syncError: row.sync_error,
  };
}

export function listArtists(): (Artist & { id: number })[] {
  const rows = getDb()
    .prepare("SELECT * FROM artists ORDER BY id ASC")
    .all() as ArtistRow[];
  return rows.map(rowToArtist);
}

export function getArtistBySlug(slug: string): (Artist & { id: number }) | undefined {
  const row = getDb()
    .prepare("SELECT * FROM artists WHERE slug = ?")
    .get(slug) as ArtistRow | undefined;
  return row ? rowToArtist(row) : undefined;
}

export function getArtistById(id: number): (Artist & { id: number }) | undefined {
  const row = getDb()
    .prepare("SELECT * FROM artists WHERE id = ?")
    .get(id) as ArtistRow | undefined;
  return row ? rowToArtist(row) : undefined;
}

export interface ArtistInput {
  slug: string;
  name: string;
  genre: string;
  tagline: string;
  shortBio: string;
  longBio: string;
  albums: Album[];
  palette: { from: string; to: string };
  profileLinks: Record<string, string>;
  songs: Song[];
  homeImage?: string | null;
  pageImage?: string | null;
  backdrop?: MediaRef | null;
  hoverMedia?: MediaRef | null;
  hoverBackdropEnabled?: boolean;
  syncSources?: Partial<Record<Platform, string>>;
  syncEnabled?: boolean;
}

export function createArtist(input: ArtistInput): Artist & { id: number } {
  const info = getDb()
    .prepare(
      `INSERT INTO artists (slug, name, genre, tagline, short_bio, long_bio, albums, palette_from, palette_to, profile_links, songs, home_image, page_image, backdrop, hover_media, hover_backdrop_enabled, sync_sources, sync_enabled)
       VALUES (@slug, @name, @genre, @tagline, @short_bio, @long_bio, @albums, @palette_from, @palette_to, @profile_links, @songs, @home_image, @page_image, @backdrop, @hover_media, @hover_backdrop_enabled, @sync_sources, @sync_enabled)`,
    )
    .run({
      slug: input.slug,
      name: input.name,
      genre: input.genre,
      tagline: input.tagline,
      short_bio: input.shortBio,
      long_bio: input.longBio,
      albums: JSON.stringify(input.albums),
      palette_from: input.palette.from,
      palette_to: input.palette.to,
      profile_links: JSON.stringify(input.profileLinks),
      songs: JSON.stringify(input.songs),
      home_image: input.homeImage ?? null,
      page_image: input.pageImage ?? null,
      backdrop: input.backdrop ? JSON.stringify(input.backdrop) : null,
      hover_media: input.hoverMedia ? JSON.stringify(input.hoverMedia) : null,
      hover_backdrop_enabled: input.hoverBackdropEnabled === false ? 0 : 1,
      sync_sources: JSON.stringify(input.syncSources ?? {}),
      sync_enabled: input.syncEnabled ? 1 : 0,
    });
  return getArtistById(Number(info.lastInsertRowid))!;
}

export function updateArtist(
  id: number,
  input: ArtistInput,
): (Artist & { id: number }) | undefined {
  getDb()
    .prepare(
      `UPDATE artists SET slug = @slug, name = @name, genre = @genre,
       tagline = @tagline, short_bio = @short_bio, long_bio = @long_bio,
       albums = @albums, palette_from = @palette_from, palette_to = @palette_to,
       profile_links = @profile_links, songs = @songs,
       home_image = @home_image, page_image = @page_image,
       backdrop = @backdrop, hover_media = @hover_media,
       hover_backdrop_enabled = @hover_backdrop_enabled,
       sync_sources = @sync_sources, sync_enabled = @sync_enabled
       WHERE id = @id`,
    )
    .run({
      id,
      slug: input.slug,
      name: input.name,
      genre: input.genre,
      tagline: input.tagline,
      short_bio: input.shortBio,
      long_bio: input.longBio,
      albums: JSON.stringify(input.albums),
      palette_from: input.palette.from,
      palette_to: input.palette.to,
      profile_links: JSON.stringify(input.profileLinks),
      songs: JSON.stringify(input.songs),
      home_image: input.homeImage ?? null,
      page_image: input.pageImage ?? null,
      backdrop: input.backdrop ? JSON.stringify(input.backdrop) : null,
      hover_media: input.hoverMedia ? JSON.stringify(input.hoverMedia) : null,
      hover_backdrop_enabled: input.hoverBackdropEnabled === false ? 0 : 1,
      sync_sources: JSON.stringify(input.syncSources ?? {}),
      sync_enabled: input.syncEnabled ? 1 : 0,
    });
  return getArtistById(id);
}

export function listSyncableArtists(): (Artist & { id: number })[] {
  return listArtists().filter(
    (artist) =>
      artist.syncEnabled &&
      Object.values(artist.syncSources ?? {}).some((source) => Boolean(source)),
  );
}

export function updateArtistCatalog(
  id: number,
  albums: Album[],
  songs: Song[],
): (Artist & { id: number }) | undefined {
  getDb()
    .prepare(
      `UPDATE artists SET albums = ?, songs = ?, last_synced_at = datetime('now'),
       last_sync_attempt_at = datetime('now'), sync_error = '' WHERE id = ?`,
    )
    .run(JSON.stringify(albums), JSON.stringify(songs), id);
  return getArtistById(id);
}

export function markArtistSyncError(id: number, message: string) {
  getDb()
    .prepare(
      `UPDATE artists SET last_sync_attempt_at = datetime('now'),
       sync_error = ? WHERE id = ?`,
    )
    .run(message.slice(0, 500), id);
}

export interface ArtistReleaseEventInput {
  artistSlug: string;
  releaseKey: string;
  releaseType: "song" | "album" | "ep";
  title: string;
  artistName: string;
  albumName?: string;
  releaseUrl?: string;
}

export interface ArtistReleaseEventRow {
  artist_slug: string;
  release_key: string;
  release_type: "song" | "album" | "ep";
  title: string;
  artist_name: string;
  album_name: string;
  release_url: string;
  detected_at: string;
  notified_at: string | null;
}

export function recordArtistReleaseEvents(events: ArtistReleaseEventInput[]) {
  const insert = getDb().prepare(
    `INSERT OR IGNORE INTO artist_release_events
     (artist_slug, release_key, release_type, title, artist_name, album_name, release_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const event of events) {
    if (!event.artistSlug || !event.releaseKey || !event.title) continue;
    insert.run(
      event.artistSlug,
      event.releaseKey,
      event.releaseType,
      event.title,
      event.artistName,
      event.albumName ?? "",
      event.releaseUrl ?? "",
    );
  }
}

export function listPendingArtistReleaseEvents(
  artistSlug: string,
): ArtistReleaseEventRow[] {
  if (!artistSlug) return [];
  return getDb()
    .prepare(
      `SELECT * FROM artist_release_events
       WHERE artist_slug = ? AND notified_at IS NULL ORDER BY detected_at ASC`,
    )
    .all(artistSlug) as ArtistReleaseEventRow[];
}

export function markArtistReleaseEventsNotified(
  events: ArtistReleaseEventRow[],
) {
  if (events.length === 0) return;
  const update = getDb().prepare(
    `UPDATE artist_release_events SET notified_at = datetime('now')
     WHERE artist_slug = ? AND release_key = ?`,
  );
  for (const event of events) update.run(event.artist_slug, event.release_key);
}

export function deleteArtist(id: number) {
  const database = getDb();
  const artist = getArtistById(id);
  if (!artist) return;
  database
    .prepare("DELETE FROM artist_release_events WHERE artist_slug = ?")
    .run(artist.slug);
  database.prepare("DELETE FROM artists WHERE id = ?").run(id);
}

function seedPostsTable(database: Database.Database) {
  const count = database
    .prepare("SELECT COUNT(*) AS count FROM posts")
    .get() as { count: number };
  if (count.count > 0) return;
  const insert = database.prepare(
    `INSERT INTO posts (slug, title, brief, date, hero_image, body, status)
     VALUES (@slug, @title, @brief, @date, @hero_image, @body, 'published')`,
  );
  for (const post of seedInitialPosts) {
    insert.run({
      slug: post.slug,
      title: post.title,
      brief: post.brief,
      date: post.date,
      hero_image: post.heroImage ?? null,
      body: JSON.stringify(post.body),
    });
  }
}

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function getSiteContent<T>(key: string): T | null {
  const row = getDb()
    .prepare("SELECT value FROM site_content WHERE key = ?")
    .get(key) as { value: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export function setSiteContent(key: string, value: unknown) {
  getDb()
    .prepare(
      `INSERT INTO site_content (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value,
       updated_at = datetime('now')`,
    )
    .run(key, JSON.stringify(value));
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value);
}

export function getNotificationsEnabled(): boolean {
  return getSetting("notifications_enabled") !== "false";
}

export function setNotificationsEnabled(enabled: boolean) {
  setSetting("notifications_enabled", enabled ? "true" : "false");
}

export function listPublishedPosts(search?: string): BlogPostRow[] {
  const searchClause = search
    ? `AND (title LIKE @q OR brief LIKE @q OR excerpt LIKE @q OR body LIKE @q OR category LIKE @q OR tags LIKE @q OR author LIKE @q)`
    : "";
  const statement = getDb().prepare(
    `SELECT * FROM posts
     WHERE (status = 'published'
       OR (status = 'scheduled' AND published_at IS NOT NULL AND published_at <= datetime('now')))
     ${searchClause}
     ORDER BY COALESCE(published_at, date) DESC, id DESC`,
  );
  const rows = search
    ? (statement.all({ q: `%${search}%` }) as BlogPostRow[])
    : (statement.all() as BlogPostRow[]);
  return rows;
}

export function listAllPosts(): BlogPostRow[] {
  return getDb()
    .prepare("SELECT * FROM posts ORDER BY id DESC")
    .all() as BlogPostRow[];
}

export function getRelatedPosts(
  slug: string,
  category: string,
  tags: string[],
  entities: string[],
  limit = 3,
): BlogPostRow[] {
  const tagSet = new Set(tags.map((tag) => tag.toLowerCase()));
  const entitySet = new Set(entities.map((entity) => entity.toLowerCase()));
  const scored = listPublishedPosts()
    .filter((row) => row.slug !== slug)
    .map((row) => {
      let score = 0;
      let rowTags: string[] = [];
      let rowEntities: string[] = [];
      try {
        rowTags = JSON.parse(row.tags) as string[];
      } catch {
        rowTags = [];
      }
      try {
        rowEntities = JSON.parse(row.entities) as string[];
      } catch {
        rowEntities = [];
      }
      if (category && row.category === category) score += 2;
      for (const tag of rowTags) {
        if (tagSet.has(tag.toLowerCase())) score += 3;
      }
      for (const entity of rowEntities) {
        if (entitySet.has(entity.toLowerCase())) score += 3;
      }
      return { row, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.row);
}

export function getPostBySlug(slug: string): BlogPostRow | undefined {
  return getDb()
    .prepare("SELECT * FROM posts WHERE slug = ?")
    .get(slug) as BlogPostRow | undefined;
}

export function getPostById(id: number): BlogPostRow | undefined {
  return getDb()
    .prepare("SELECT * FROM posts WHERE id = ?")
    .get(id) as BlogPostRow | undefined;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SourceItem {
  url: string;
  label: string;
  publication?: string;
  date?: string;
  type?: string;
}

export interface AuthorLink {
  label: string;
  url: string;
}

export interface PostInput {
  slug: string;
  title: string;
  brief: string;
  date: string;
  hero_image: string | null;
  body: string;
  status: "draft" | "published" | "scheduled";
  excerpt: string;
  featured_image: string | null;
  category: string;
  tags: string[];
  author: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  primary_keyword: string;
  secondary_keywords: string[];
  search_intent: string;
  article_summary: string;
  key_takeaways: string[];
  direct_answer: string;
  key_facts: string[];
  entities: string[];
  topics: string[];
  editorial_perspective: string;
  faq: FaqItem[];
  sources: SourceItem[];
  author_title: string;
  author_bio: string;
  author_image: string | null;
  author_links: AuthorLink[];
  image_alt: string;
  related_slugs: string[];
  materially_updated_at: string | null;
  reviewed_at: string | null;
}

export interface PostApiBody {
  title?: string;
  brief?: string;
  date?: string;
  heroImage?: string | null;
  body?: unknown;
  status?: string;
  excerpt?: string;
  category?: string;
  tags?: string;
  author?: string;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  primaryKeyword?: string;
  secondaryKeywords?: string;
  searchIntent?: string;
  articleSummary?: string;
  keyTakeaways?: string;
  directAnswer?: string;
  keyFacts?: string;
  entities?: string;
  topics?: string;
  editorialPerspective?: string;
  faq?: unknown;
  sources?: unknown;
  authorTitle?: string;
  authorBio?: string;
  authorImage?: string | null;
  authorLinks?: unknown;
  imageAlt?: string;
  relatedSlugs?: string;
  materiallyUpdatedAt?: string | null;
  reviewedAt?: string | null;
}

function splitList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseLines(value?: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseJsonArray<T>(value: unknown, existing?: string): T[] {
  const raw =
    value !== undefined
      ? typeof value === "string"
        ? value
        : JSON.stringify(value)
      : (existing ?? "[]");
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function postInputFromApi(
  body: PostApiBody,
  existing?: BlogPostRow,
): Omit<PostInput, "slug" | "status"> & { status: PostInput["status"] } {
  const tags = body.tags ?? "";
  const parsedTags = tags.startsWith("[")
    ? parseJsonArray<string>(tags, existing?.tags)
    : splitList(tags);
  return {
    title: body.title ?? existing?.title ?? "",
    brief: body.brief ?? existing?.brief ?? "",
    date:
      body.date ??
      existing?.date ??
      new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    hero_image:
      body.heroImage === undefined
        ? (existing?.hero_image ?? null)
        : body.heroImage,
    body:
      body.body === undefined
        ? (existing?.body ?? "[]")
        : JSON.stringify(body.body ?? []),
    status:
      body.status === "published" ||
      body.status === "scheduled" ||
      body.status === "draft"
        ? body.status
        : (existing?.status ?? "draft"),
    excerpt: body.excerpt ?? existing?.excerpt ?? "",
    featured_image:
      body.heroImage === undefined
        ? (existing?.featured_image ?? existing?.hero_image ?? null)
        : body.heroImage,
    category: body.category ?? existing?.category ?? "",
    tags: parsedTags,
    author: body.author || existing?.author || "Yellow White Noise",
    published_at:
      body.publishedAt === undefined
        ? (existing?.published_at ?? null)
        : body.publishedAt,
    seo_title:
      body.seoTitle === undefined
        ? (existing?.seo_title ?? null)
        : body.seoTitle,
    seo_description:
      body.seoDescription === undefined
        ? (existing?.seo_description ?? null)
        : body.seoDescription,
    primary_keyword: body.primaryKeyword ?? existing?.primary_keyword ?? "",
    secondary_keywords:
      body.secondaryKeywords !== undefined
        ? splitList(body.secondaryKeywords)
        : parseJsonArray<string>(undefined, existing?.secondary_keywords),
    search_intent: body.searchIntent ?? existing?.search_intent ?? "",
    article_summary:
      body.articleSummary ?? existing?.article_summary ?? "",
    key_takeaways:
      body.keyTakeaways !== undefined
        ? parseLines(body.keyTakeaways)
        : parseJsonArray<string>(undefined, existing?.key_takeaways),
    direct_answer: body.directAnswer ?? existing?.direct_answer ?? "",
    key_facts:
      body.keyFacts !== undefined
        ? parseLines(body.keyFacts)
        : parseJsonArray<string>(undefined, existing?.key_facts),
    entities:
      body.entities !== undefined
        ? splitList(body.entities)
        : parseJsonArray<string>(undefined, existing?.entities),
    topics:
      body.topics !== undefined
        ? splitList(body.topics)
        : parseJsonArray<string>(undefined, existing?.topics),
    editorial_perspective:
      body.editorialPerspective ?? existing?.editorial_perspective ?? "",
    faq: parseJsonArray<FaqItem>(body.faq, existing?.faq),
    sources: parseJsonArray<SourceItem>(body.sources, existing?.sources),
    author_title: body.authorTitle ?? existing?.author_title ?? "",
    author_bio: body.authorBio ?? existing?.author_bio ?? "",
    author_image:
      body.authorImage === undefined
        ? (existing?.author_image ?? null)
        : body.authorImage,
    author_links: parseJsonArray<AuthorLink>(
      body.authorLinks,
      existing?.author_links,
    ),
    image_alt: body.imageAlt ?? existing?.image_alt ?? "",
    related_slugs:
      body.relatedSlugs !== undefined
        ? splitList(body.relatedSlugs)
        : parseJsonArray<string>(undefined, existing?.related_slugs),
    materially_updated_at:
      body.materiallyUpdatedAt === undefined
        ? (existing?.materially_updated_at ?? null)
        : body.materiallyUpdatedAt,
    reviewed_at:
      body.reviewedAt === undefined
        ? (existing?.reviewed_at ?? null)
        : body.reviewedAt,
  };
}

function postParams(data: PostInput) {
  return {
    ...data,
    tags: JSON.stringify(data.tags),
    secondary_keywords: JSON.stringify(data.secondary_keywords),
    key_takeaways: JSON.stringify(data.key_takeaways),
    key_facts: JSON.stringify(data.key_facts),
    entities: JSON.stringify(data.entities),
    topics: JSON.stringify(data.topics),
    faq: JSON.stringify(data.faq),
    sources: JSON.stringify(data.sources),
    author_links: JSON.stringify(data.author_links),
    related_slugs: JSON.stringify(data.related_slugs),
    featured_image: data.featured_image ?? data.hero_image,
  };
}

export function createPost(data: PostInput): BlogPostRow {
  const info = getDb()
    .prepare(
      `INSERT INTO posts (slug, title, brief, date, hero_image, body, status,
       excerpt, featured_image, category, tags, author, published_at, seo_title, seo_description,
       primary_keyword, secondary_keywords, search_intent, article_summary, key_takeaways,
       direct_answer, key_facts, entities, topics, editorial_perspective, faq, sources,
       author_title, author_bio, author_image, author_links, image_alt, related_slugs,
       materially_updated_at, reviewed_at)
       VALUES (@slug, @title, @brief, @date, @hero_image, @body, @status,
       @excerpt, @featured_image, @category, @tags, @author, @published_at, @seo_title, @seo_description,
       @primary_keyword, @secondary_keywords, @search_intent, @article_summary, @key_takeaways,
       @direct_answer, @key_facts, @entities, @topics, @editorial_perspective, @faq, @sources,
       @author_title, @author_bio, @author_image, @author_links, @image_alt, @related_slugs,
       @materially_updated_at, @reviewed_at)`,
    )
    .run(postParams(data));
  return getPostById(Number(info.lastInsertRowid))!;
}

export function updatePost(id: number, data: PostInput): BlogPostRow | undefined {
  getDb()
    .prepare(
      `UPDATE posts SET slug = @slug, title = @title, brief = @brief,
       date = @date, hero_image = @hero_image, body = @body, status = @status,
       excerpt = @excerpt, featured_image = @featured_image, category = @category,
       tags = @tags, author = @author, published_at = @published_at,
       seo_title = @seo_title, seo_description = @seo_description,
       primary_keyword = @primary_keyword, secondary_keywords = @secondary_keywords,
       search_intent = @search_intent, article_summary = @article_summary,
       key_takeaways = @key_takeaways, direct_answer = @direct_answer,
       key_facts = @key_facts, entities = @entities, topics = @topics,
       editorial_perspective = @editorial_perspective, faq = @faq, sources = @sources,
       author_title = @author_title, author_bio = @author_bio,
       author_image = @author_image, author_links = @author_links,
       image_alt = @image_alt, related_slugs = @related_slugs,
       materially_updated_at = @materially_updated_at, reviewed_at = @reviewed_at,
       updated_at = datetime('now') WHERE id = @id`,
    )
    .run({ ...postParams(data), id });
  return getPostById(id);
}

export function deletePost(id: number) {
  getDb().prepare("DELETE FROM posts WHERE id = ?").run(id);
}

export function isPubliclyVisible(row: BlogPostRow): boolean {
  if (row.status === "published") return true;
  if (row.status === "scheduled" && row.published_at) {
    return new Date(row.published_at).getTime() <= Date.now();
  }
  return false;
}

export function getPublicPostBySlug(slug: string): BlogPostRow | undefined {
  const post = getPostBySlug(slug);
  if (!post) return undefined;
  return isPubliclyVisible(post) ? post : undefined;
}

export interface PlaylistRow {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  cover_url: string | null;
  cover_palette_from: string;
  cover_palette_to: string;
  links: string;
  entries: string;
  track_link_mode: string;
  source_platform: string;
  source_id: string;
  source_url: string;
  visible: number;
  sort_order: number;
  last_synced_at: string | null;
  last_sync_attempt_at: string | null;
  sync_error: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistInput {
  name: string;
  tagline: string;
  description: string;
  coverUrl: string | null;
  coverPaletteFrom: string;
  coverPaletteTo: string;
  links: Partial<Record<Platform, string>>;
  entries: PlaylistTrack[];
  sourcePlatform: Platform;
  sourceId: string;
  sourceUrl: string;
  visible: boolean;
  sortOrder: number;
}

export interface PlaylistUpdateInput {
  name?: string;
  tagline?: string;
  description?: string;
  coverUrl?: string | null;
  links?: Partial<Record<Platform, string>>;
  visible?: boolean;
  sortOrder?: number;
  trackLinkMode?: "song" | "playlist";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePlaylistLinks(raw: string): Partial<Record<Platform, string>> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return {};
    const links: Partial<Record<Platform, string>> = {};
    for (const platform of Object.keys(platformHomeUrls) as Platform[]) {
      if (typeof parsed[platform] === "string" && parsed[platform]) {
        links[platform] = parsed[platform];
      }
    }
    return links;
  } catch {
    return {};
  }
}

function parsePlaylistTracks(raw: string): PlaylistTrack[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is PlaylistTrack => {
      if (!isRecord(entry)) return false;
      return (
        typeof entry.title === "string" &&
        typeof entry.artistName === "string" &&
        isRecord(entry.links)
      );
    });
  } catch {
    return [];
  }
}

function playlistFromRow(row: PlaylistRow): Playlist {
  const availableLinks = parsePlaylistLinks(row.links);
  const links = { ...platformHomeUrls, ...availableLinks };
  const tracks = parsePlaylistTracks(row.entries);
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    coverUrl: row.cover_url ?? undefined,
    coverPalette: {
      from: row.cover_palette_from,
      to: row.cover_palette_to,
    },
    links,
    availableLinks,
    trackLinkMode: row.track_link_mode === "playlist" ? "playlist" : "song",
    entries: tracks.map((track) => ({ kind: "track", track })),
  };
}

export function listPlaylistRows(): PlaylistRow[] {
  return getDb()
    .prepare("SELECT * FROM playlists ORDER BY sort_order ASC, id DESC")
    .all() as PlaylistRow[];
}

export function listPublicPlaylists(): Playlist[] {
  const rows = listPlaylistRows();
  if (rows.length === 0) return seedPlaylists;
  return rows.filter((row) => row.visible === 1).map(playlistFromRow);
}

export function getPublicPlaylist(slug: string): Playlist | undefined {
  return listPublicPlaylists().find((playlist) => playlist.slug === slug);
}

export function getPlaylistRowById(id: number): PlaylistRow | undefined {
  return getDb()
    .prepare("SELECT * FROM playlists WHERE id = ?")
    .get(id) as PlaylistRow | undefined;
}

export function findPlaylistBySource(
  sourcePlatform: Platform,
  sourceId: string,
): PlaylistRow | undefined {
  return getDb()
    .prepare(
      "SELECT * FROM playlists WHERE source_platform = ? AND source_id = ?",
    )
    .get(sourcePlatform, sourceId) as PlaylistRow | undefined;
}

function playlistSlug(name: string, sourcePlatform: Platform, sourceId: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "playlist";
  const taken = (slug: string) =>
    Boolean(
      getDb().prepare("SELECT 1 FROM playlists WHERE slug = ?").get(slug),
    );
  if (!taken(base)) return base;
  const platformSlug = `${base}-${sourcePlatform}`;
  if (!taken(platformSlug)) return platformSlug;
  const suffix = sourceId.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(-6);
  if (suffix && !taken(`${platformSlug}-${suffix}`)) {
    return `${platformSlug}-${suffix}`;
  }
  let counter = 2;
  while (taken(`${platformSlug}-${counter}`)) counter += 1;
  return `${platformSlug}-${counter}`;
}

export function artistSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "artist";
  if (!getArtistBySlug(base)) return base;
  let counter = 2;
  while (getArtistBySlug(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

export function createPlaylist(input: PlaylistInput): PlaylistRow {
  const slug = playlistSlug(input.name, input.sourcePlatform, input.sourceId);
  const info = getDb()
    .prepare(
      `INSERT INTO playlists
       (slug, name, tagline, description, cover_url, cover_palette_from, cover_palette_to,
        links, entries, source_platform, source_id, source_url, visible, sort_order,
        last_synced_at, last_sync_attempt_at, sync_error)
       VALUES (@slug, @name, @tagline, @description, @cover_url, @cover_palette_from,
       @cover_palette_to, @links, @entries, @source_platform, @source_id, @source_url,
        @visible, @sort_order, datetime('now'), datetime('now'), '')`,
    )
    .run({
      slug,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      cover_url: input.coverUrl,
      cover_palette_from: input.coverPaletteFrom,
      cover_palette_to: input.coverPaletteTo,
      links: JSON.stringify(input.links),
      entries: JSON.stringify(input.entries),
      source_platform: input.sourcePlatform,
      source_id: input.sourceId,
      source_url: input.sourceUrl,
      visible: input.visible ? 1 : 0,
      sort_order: input.sortOrder,
    });
  return getPlaylistRowById(Number(info.lastInsertRowid))!;
}

export function updatePlaylist(
  id: number,
  input: PlaylistUpdateInput,
): PlaylistRow | undefined {
  const existing = getPlaylistRowById(id);
  if (!existing) return undefined;
  const links = {
    ...parsePlaylistLinks(existing.links),
    ...(input.links ?? {}),
  };
  getDb()
    .prepare(
      `UPDATE playlists SET name = @name, tagline = @tagline, description = @description,
       cover_url = @cover_url, links = @links, visible = @visible, sort_order = @sort_order,
       track_link_mode = @track_link_mode,
       updated_at = datetime('now') WHERE id = @id`,
    )
    .run({
      id,
      name: input.name ?? existing.name,
      tagline: input.tagline ?? existing.tagline,
      description: input.description ?? existing.description,
      cover_url:
        input.coverUrl === undefined ? existing.cover_url : input.coverUrl,
      links: JSON.stringify(links),
      visible: input.visible === undefined ? existing.visible : input.visible ? 1 : 0,
      sort_order: input.sortOrder ?? existing.sort_order,
      track_link_mode: input.trackLinkMode ?? existing.track_link_mode ?? "song",
    });
  return getPlaylistRowById(id);
}

export function refreshImportedPlaylist(
  id: number,
  input: PlaylistInput,
): PlaylistRow | undefined {
  const existing = getPlaylistRowById(id);
  if (!existing) return undefined;
  const links = {
    ...parsePlaylistLinks(existing.links),
    ...input.links,
  };
  getDb()
    .prepare(
      `UPDATE playlists SET name = @name, tagline = @tagline, description = @description,
       cover_url = @cover_url, cover_palette_from = @cover_palette_from,
       cover_palette_to = @cover_palette_to, links = @links, entries = @entries,
       source_url = @source_url, last_synced_at = datetime('now'),
       last_sync_attempt_at = datetime('now'), sync_error = '',
       updated_at = datetime('now') WHERE id = @id`,
    )
    .run({
      id,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      cover_url: input.coverUrl,
      cover_palette_from: input.coverPaletteFrom,
      cover_palette_to: input.coverPaletteTo,
      links: JSON.stringify(links),
      entries: JSON.stringify(input.entries),
      source_url: input.sourceUrl,
    });
  return getPlaylistRowById(id);
}

export function markPlaylistSyncError(id: number, message: string) {
  getDb()
    .prepare(
      `UPDATE playlists SET last_sync_attempt_at = datetime('now'),
       sync_error = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .run(message.slice(0, 500), id);
}

export function deletePlaylist(id: number) {
  const database = getDb();
  const playlist = getPlaylistRowById(id);
  if (!playlist) return;
  database
    .prepare("DELETE FROM playlist_subscriptions WHERE playlist_slug = ?")
    .run(playlist.slug);
  database
    .prepare("DELETE FROM playlist_track_events WHERE playlist_slug = ?")
    .run(playlist.slug);
  database.prepare("DELETE FROM playlists WHERE id = ?").run(id);
}

export function getCachedJson<T>(key: string): T | undefined {
  const row = getDb()
    .prepare("SELECT value, expires_at FROM app_cache WHERE cache_key = ?")
    .get(key) as { value: string; expires_at: number } | undefined;
  if (!row) return undefined;
  if (row.expires_at <= Date.now()) {
    getDb().prepare("DELETE FROM app_cache WHERE cache_key = ?").run(key);
    return undefined;
  }
  try {
    return JSON.parse(row.value) as T;
  } catch {
    getDb().prepare("DELETE FROM app_cache WHERE cache_key = ?").run(key);
    return undefined;
  }
}

export function setCachedJson(key: string, value: unknown, ttlMs: number) {
  getDb()
    .prepare(
      `INSERT INTO app_cache (cache_key, value, expires_at)
       VALUES (?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET value = excluded.value,
       expires_at = excluded.expires_at`,
    )
    .run(key, JSON.stringify(value), Date.now() + ttlMs);
}

export function clearCachedByPrefix(prefix: string): number {
  const info = getDb()
    .prepare("DELETE FROM app_cache WHERE cache_key LIKE ? ESCAPE '\\'")
    .run(`${prefix.replace(/[\\%_]/g, "\\$&")}%`);
  return Number(info.changes);
}

const subscriberSelect = `
  SELECT subscribers.*,
    (SELECT COUNT(*) FROM playlist_subscriptions
     WHERE playlist_subscriptions.subscriber_id = subscribers.id) AS playlist_count
  FROM subscribers`;

export function addSubscriber(
  email: string,
  globalUpdates = true,
): { added: boolean } {
  const normalized = email.trim().toLowerCase();
  const database = getDb();
  const existing = database
    .prepare("SELECT id, status, global_updates FROM subscribers WHERE email = ?")
    .get(normalized) as
    | { id: number; status: string; global_updates: number }
    | undefined;
  if (existing?.status === "active") {
    // Never downgrade global updates: joining one playlist must not
    // silently unsubscribe someone from everything else.
    if (globalUpdates && !existing.global_updates) {
      database
        .prepare("UPDATE subscribers SET global_updates = 1 WHERE id = ?")
        .run(existing.id);
    }
    return { added: false };
  }
  if (existing) {
    database
      .prepare(
        `UPDATE subscribers SET status = 'active', global_updates = ?,
         unsubscribed_at = NULL WHERE id = ?`,
      )
      .run(existing.global_updates || globalUpdates ? 1 : 0, existing.id);
    return { added: true };
  }
  const info = database
    .prepare(
      "INSERT INTO subscribers (email, status, global_updates) VALUES (?, 'active', ?)",
    )
    .run(normalized, globalUpdates ? 1 : 0);
  return { added: info.changes > 0 };
}

export function subscribeToPlaylist(
  email: string,
  playlistSlug: string,
  globalUpdates = false,
): { added: boolean; playlistAdded: boolean } {
  const subscriberResult = addSubscriber(email, globalUpdates);
  const normalized = email.trim().toLowerCase();
  const subscriber = getDb()
    .prepare("SELECT id FROM subscribers WHERE email = ?")
    .get(normalized) as { id: number } | undefined;
  if (!subscriber) return { ...subscriberResult, playlistAdded: false };
  const result = getDb()
    .prepare(
      `INSERT OR IGNORE INTO playlist_subscriptions (subscriber_id, playlist_slug)
       VALUES (?, ?)`,
    )
    .run(subscriber.id, playlistSlug.trim());
  return { ...subscriberResult, playlistAdded: result.changes > 0 };
}

export interface PushSubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  playlists: string;
  created_at: string;
}

export function parsePushPlaylists(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

export function upsertPushSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
  playlists: string[],
): void {
  getDb()
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, playlists)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         playlists = excluded.playlists`,
    )
    .run(endpoint, p256dh, auth, JSON.stringify(playlists));
}

export function setPushSubscriptionPlaylists(
  endpoint: string,
  playlists: string[],
): boolean {
  const info = getDb()
    .prepare("UPDATE push_subscriptions SET playlists = ? WHERE endpoint = ?")
    .run(JSON.stringify(playlists), endpoint);
  return info.changes > 0;
}

export function removePushSubscription(endpoint: string): void {
  getDb()
    .prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
    .run(endpoint);
}

export function listPushSubscriptions(): PushSubscriptionRow[] {
  return getDb()
    .prepare("SELECT * FROM push_subscriptions ORDER BY id DESC")
    .all() as PushSubscriptionRow[];
}

export function listPushSubscriptionsForPlaylist(
  playlistSlug: string,
): PushSubscriptionRow[] {
  return listPushSubscriptions().filter((row) => {
    const playlists = parsePushPlaylists(row.playlists);
    return playlists.length === 0 || playlists.includes(playlistSlug);
  });
}

export function countPushSubscriptions(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS count FROM push_subscriptions")
    .get() as { count: number };
  return row.count;
}

export function listSubscribers(): SubscriberRow[] {
  return getDb()
    .prepare(`${subscriberSelect} ORDER BY subscribers.id DESC`)
    .all() as SubscriberRow[];
}

export function listActiveSubscribers(): SubscriberRow[] {
  return getDb()
    .prepare(
      `${subscriberSelect} WHERE subscribers.status = 'active' ORDER BY subscribers.id DESC`,
    )
    .all() as SubscriberRow[];
}

export function listGlobalSubscribers(): SubscriberRow[] {
  return getDb()
    .prepare(
      `${subscriberSelect}
       WHERE subscribers.status = 'active' AND subscribers.global_updates = 1
       ORDER BY subscribers.id DESC`,
    )
    .all() as SubscriberRow[];
}

export function listPlaylistSubscribers(playlistSlug: string): SubscriberRow[] {
  return getDb()
    .prepare(
      `${subscriberSelect}
       INNER JOIN playlist_subscriptions
         ON playlist_subscriptions.subscriber_id = subscribers.id
       WHERE subscribers.status = 'active'
         AND playlist_subscriptions.playlist_slug = ?
       ORDER BY subscribers.id DESC`,
    )
    .all(playlistSlug) as SubscriberRow[];
}

export function listSubscribersByIds(ids: number[]): SubscriberRow[] {
  const validIds = ids.filter((id) => Number.isInteger(id) && id > 0);
  if (validIds.length === 0) return [];
  const placeholders = validIds.map(() => "?").join(",");
  return getDb()
    .prepare(
      `${subscriberSelect}
       WHERE subscribers.status = 'active' AND subscribers.id IN (${placeholders})
       ORDER BY subscribers.id DESC`,
    )
    .all(...validIds) as SubscriberRow[];
}

export function updateSubscriberStatus(
  ids: number[],
  status: "active" | "unsubscribed",
) {
  const validIds = ids.filter((id) => Number.isInteger(id) && id > 0);
  if (validIds.length === 0) return;
  const placeholders = validIds.map(() => "?").join(",");
  getDb()
    .prepare(
      `UPDATE subscribers
       SET status = ?, unsubscribed_at = CASE WHEN ? = 'unsubscribed'
       THEN datetime('now') ELSE NULL END
       WHERE id IN (${placeholders})`,
    )
    .run(status, status, ...validIds);
}

export function deleteSubscribers(ids: number[]) {
  const validIds = ids.filter((id) => Number.isInteger(id) && id > 0);
  if (validIds.length === 0) return;
  const placeholders = validIds.map(() => "?").join(",");
  const database = getDb();
  database
    .prepare(
      `DELETE FROM playlist_subscriptions WHERE subscriber_id IN (${placeholders})`,
    )
    .run(...validIds);
  database
    .prepare(`DELETE FROM subscribers WHERE id IN (${placeholders})`)
    .run(...validIds);
}

export interface PlaylistTrackEventInput {
  playlistSlug: string;
  trackKey: string;
  title: string;
  artistName: string;
  trackUrl?: string;
}

export interface PlaylistTrackEventRow {
  playlist_slug: string;
  track_key: string;
  title: string;
  artist_name: string;
  track_url: string;
  detected_at: string;
  notified_at: string | null;
}

export function recordPlaylistTrackEvents(
  events: PlaylistTrackEventInput[],
): PlaylistTrackEventRow[] {
  const database = getDb();
  const insert = database.prepare(
    `INSERT OR IGNORE INTO playlist_track_events
     (playlist_slug, track_key, title, artist_name, track_url)
     VALUES (?, ?, ?, ?, ?)`,
  );
  for (const event of events) {
    if (!event.playlistSlug || !event.trackKey || !event.title) continue;
    insert.run(
      event.playlistSlug,
      event.trackKey,
      event.title,
      event.artistName,
      event.trackUrl ?? "",
    );
  }
  return listPendingPlaylistTrackEvents(events[0]?.playlistSlug ?? "");
}

export function listPendingPlaylistTrackEvents(
  playlistSlug: string,
): PlaylistTrackEventRow[] {
  if (!playlistSlug) return [];
  return getDb()
    .prepare(
      `SELECT * FROM playlist_track_events
       WHERE playlist_slug = ? AND notified_at IS NULL ORDER BY detected_at ASC`,
    )
    .all(playlistSlug) as PlaylistTrackEventRow[];
}

export function markPlaylistTrackEventsNotified(
  events: PlaylistTrackEventRow[],
) {
  if (events.length === 0) return;
  const update = getDb().prepare(
    `UPDATE playlist_track_events SET notified_at = datetime('now')
     WHERE playlist_slug = ? AND track_key = ?`,
  );
  for (const event of events) update.run(event.playlist_slug, event.track_key);
}

export function countSubscribers(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS count FROM subscribers WHERE status = 'active'")
    .get() as { count: number };
  return row.count;
}

export interface MediaRow {
  id: number;
  filename: string;
  url: string;
  kind: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  title: string;
  caption: string;
  uploaded_at: string;
}

export function addMedia(data: {
  filename: string;
  url: string;
  kind: string;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  title?: string;
  caption?: string;
}): MediaRow {
  const info = getDb()
    .prepare(
      `INSERT INTO media (filename, url, kind, mime, size, width, height, duration, title, caption)
       VALUES (@filename, @url, @kind, @mime, @size, @width, @height, @duration, @title, @caption)`,
    )
    .run({
      filename: data.filename,
      url: data.url,
      kind: data.kind,
      mime: data.mime,
      size: data.size,
      width: data.width ?? null,
      height: data.height ?? null,
      duration: data.duration ?? null,
      title: data.title ?? "",
      caption: data.caption ?? "",
    });
  return getMediaById(Number(info.lastInsertRowid))!;
}

export function listMedia(kind?: string): MediaRow[] {
  if (kind) {
    return getDb()
      .prepare("SELECT * FROM media WHERE kind = ? ORDER BY id DESC")
      .all(kind) as MediaRow[];
  }
  return getDb()
    .prepare("SELECT * FROM media ORDER BY id DESC")
    .all() as MediaRow[];
}

export function getMediaById(id: number): MediaRow | undefined {
  return getDb()
    .prepare("SELECT * FROM media WHERE id = ?")
    .get(id) as MediaRow | undefined;
}

export function deleteMedia(id: number) {
  getDb().prepare("DELETE FROM media WHERE id = ?").run(id);
}

export interface CampaignRow {
  id: number;
  name: string;
  advertiser: string;
  creative_type: string;
  creative_html: string;
  image_url: string;
  link_url: string;
  alt: string;
  slots: string;
  targeting: string;
  priority: number;
  active: number;
  created_at: string;
}

export interface CampaignInput {
  name: string;
  advertiser: string;
  creativeType: "html" | "image";
  creativeHtml: string;
  imageUrl: string;
  linkUrl: string;
  alt: string;
  slots: string[];
  targeting: {
    countries?: string[];
    devices?: string[];
    visitorTypes?: string[];
    categories?: string[];
    tags?: string[];
    topics?: string[];
  };
  priority: number;
  active: boolean;
}

export function createCampaign(input: CampaignInput): CampaignRow {
  const info = getDb()
    .prepare(
      `INSERT INTO ad_campaigns (name, advertiser, creative_type, creative_html, image_url, link_url, alt, slots, targeting, priority, active)
       VALUES (@name, @advertiser, @creative_type, @creative_html, @image_url, @link_url, @alt, @slots, @targeting, @priority, @active)`,
    )
    .run({
      name: input.name,
      advertiser: input.advertiser,
      creative_type: input.creativeType,
      creative_html: input.creativeHtml,
      image_url: input.imageUrl,
      link_url: input.linkUrl,
      alt: input.alt,
      slots: JSON.stringify(input.slots),
      targeting: JSON.stringify(input.targeting),
      priority: input.priority,
      active: input.active ? 1 : 0,
    });
  return getCampaignById(Number(info.lastInsertRowid))!;
}

export function updateCampaign(
  id: number,
  input: CampaignInput,
): CampaignRow | undefined {
  getDb()
    .prepare(
      `UPDATE ad_campaigns SET name = @name, advertiser = @advertiser,
       creative_type = @creative_type, creative_html = @creative_html,
       image_url = @image_url, link_url = @link_url, alt = @alt,
       slots = @slots, targeting = @targeting, priority = @priority, active = @active
       WHERE id = @id`,
    )
    .run({
      id,
      name: input.name,
      advertiser: input.advertiser,
      creative_type: input.creativeType,
      creative_html: input.creativeHtml,
      image_url: input.imageUrl,
      link_url: input.linkUrl,
      alt: input.alt,
      slots: JSON.stringify(input.slots),
      targeting: JSON.stringify(input.targeting),
      priority: input.priority,
      active: input.active ? 1 : 0,
    });
  return getCampaignById(id);
}

export function deleteCampaign(id: number) {
  getDb().prepare("DELETE FROM ad_campaigns WHERE id = ?").run(id);
}

export function getCampaignById(id: number): CampaignRow | undefined {
  return getDb()
    .prepare("SELECT * FROM ad_campaigns WHERE id = ?")
    .get(id) as CampaignRow | undefined;
}

export function listCampaigns(): CampaignRow[] {
  return getDb()
    .prepare("SELECT * FROM ad_campaigns ORDER BY priority DESC, id DESC")
    .all() as CampaignRow[];
}

export function matchCampaign(
  slot: string,
  context: {
    category?: string;
    tags?: string[];
    device?: string;
    visitorType?: string;
    country?: string;
  },
): CampaignRow | undefined {
  const campaigns = listCampaigns().filter(
    (campaign) => campaign.active === 1,
  );
  const eligible = campaigns.filter((campaign) => {
    let slots: string[] = [];
    let targeting: {
      countries?: string[];
      devices?: string[];
      visitorTypes?: string[];
      categories?: string[];
      tags?: string[];
      topics?: string[];
    } = {};
    try {
      slots = JSON.parse(campaign.slots) as string[];
    } catch {
      slots = [];
    }
    try {
      targeting = JSON.parse(campaign.targeting) as typeof targeting;
    } catch {
      targeting = {};
    }
    if (slots.length && !slots.includes(slot)) return false;
    if (
      targeting.devices?.length &&
      context.device &&
      !targeting.devices.includes(context.device)
    )
      return false;
    if (
      targeting.visitorTypes?.length &&
      context.visitorType &&
      !targeting.visitorTypes.includes(context.visitorType)
    )
      return false;
    if (
      targeting.countries?.length &&
      context.country &&
      !targeting.countries.includes(context.country)
    )
      return false;
    if (
      targeting.categories?.length &&
      context.category &&
      !targeting.categories.includes(context.category)
    )
      return false;
    if (
      targeting.tags?.length &&
      context.tags?.length &&
      !context.tags.some((tag) => targeting.tags?.includes(tag) ?? false)
    )
      return false;
    return true;
  });
  return eligible.sort((a, b) => b.priority - a.priority)[0];
}
