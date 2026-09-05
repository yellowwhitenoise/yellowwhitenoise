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
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio = null;
  }
}

export const usePlaybackStore = create<PlaybackState>((set, get) => {
  /** Returns true only when audible playback actually started. */
  const spawnAudio = (track: PlaybackTrack): boolean => {
    killAudio();
    if (!track.previewUrl) return false;
    audio = new Audio(track.previewUrl);
    audio.volume = 0.8;
    audio.onended = () => {
      audio = null;
      set({ isPlaying: false });
    };
    audio.onerror = () => {
      audio = null;
      set({ isPlaying: false });
    };
    void audio.play().catch(() => {
      audio = null;
      set({ isPlaying: false });
    });
    return true;
  };

  return {
    current: null,
    isPlaying: false,
    play: (track) => {
      const started = spawnAudio(track);
      set({ current: started ? track : null, isPlaying: started });
    },
    pause: () => {
      audio?.pause();
      set({ isPlaying: false });
    },
    resume: () => {
      const { current } = get();
      if (!current) return;
      if (audio) {
        void audio.play().catch(() => {
          set({ isPlaying: false });
        });
        set({ isPlaying: true });
      } else {
        const started = spawnAudio(current);
        if (!started) set({ isPlaying: false });
        else set({ isPlaying: true });
      }
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
  };
});

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
