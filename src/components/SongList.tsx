"use client";

import { useState } from "react";
import { SongCard } from "@/components/SongCard";
import {
  isTrackActive,
  usePlaybackStore,
  type PlaybackTrack,
} from "@/lib/store/playback";
import { trackKey, useCatalogStore } from "@/lib/store/catalog";
import type { ArtistPalette, Song } from "@/lib/data";

export function SongList({
  songs,
  palette,
  artistSlug,
}: {
  songs: Song[];
  palette: ArtistPalette;
  artistSlug: string;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const current = usePlaybackStore((s) => s.current);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const resolvedMap = useCatalogStore((s) => s.resolved);
  const resolveTrackAction = useCatalogStore((s) => s.resolveTrack);

  const toTrack = (song: Song): PlaybackTrack => ({
    artistSlug,
    songSlug: song.slug,
    title: song.title,
    previewUrl:
      resolvedMap[trackKey(artistSlug, song.slug)]?.previewUrl ??
      song.previewUrl,
  });

  return (
    <ul className="flex flex-col gap-3">
      {songs.map((song, index) => (
        <SongCard
          key={song.slug}
          song={song}
          index={index}
          palette={palette}
          artistSlug={artistSlug}
          expanded={openSlug === song.slug}
          onToggle={() => {
            void resolveTrackAction(
              artistSlug,
              song.slug,
              song.title,
              song.artistName,
            );
            setOpenSlug(
              (current) => (current === song.slug ? null : song.slug),
            );
          }}
          active={isTrackActive(current, isPlaying, artistSlug, song.slug)}
          onPlayToggle={() => usePlaybackStore.getState().toggle(toTrack(song))}
        />
      ))}
    </ul>
  );
}
