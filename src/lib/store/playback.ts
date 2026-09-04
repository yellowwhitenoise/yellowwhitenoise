import { create } from "zustand";

export interface PlaybackTrack {
  artistSlug: string;
  songSlug: string;
  title: string;
  previewUrl?: string;
}

interface PlaybackState {
  current: PlaybackTrack | null;
  isPlaying: boolean;
  play: (track: PlaybackTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  toggle: (track: PlaybackTrack) => void;
}

let audio: HTMLAudioElement | null = null;

function killAudio() {
  if (audio) {
    audio.pause();
    audio = null;
  }
}

function spawnAudio(track: PlaybackTrack) {
  killAudio();
  if (!track.previewUrl) return;
  audio = new Audio(track.previewUrl);
  audio.volume = 0.8;
  void audio.play().catch(() => {});
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  current: null,
  isPlaying: false,
  play: (track) => {
    spawnAudio(track);
    set({ current: track, isPlaying: true });
  },
  pause: () => {
    audio?.pause();
    set({ isPlaying: false });
  },
  resume: () => {
    const { current } = get();
    if (!current) return;
    if (audio) {
      void audio.play().catch(() => {});
    } else {
      spawnAudio(current);
    }
    set({ isPlaying: true });
  },
  stop: () => {
    killAudio();
    set({ current: null, isPlaying: false });
  },
  toggle: (track) => {
    const { current, isPlaying } = get();
    const sameTrack =
      current?.artistSlug === track.artistSlug &&
      current?.songSlug === track.songSlug;
    if (sameTrack) {
      if (isPlaying) get().pause();
      else get().resume();
    } else {
      get().play(track);
    }
  },
}));

export function isTrackActive(
  current: PlaybackTrack | null,
  isPlaying: boolean,
  artistSlug: string,
  songSlug: string,
): boolean {
  return (
    isPlaying &&
    current?.artistSlug === artistSlug &&
    current?.songSlug === songSlug
  );
}
