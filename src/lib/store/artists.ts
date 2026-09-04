import { create } from "zustand";
import type { Artist } from "@/lib/data";

interface ArtistsState {
  artists: Artist[];
  setArtists: (artists: Artist[]) => void;
  ensureLoaded: () => Promise<void>;
}

export const useArtistsStore = create<ArtistsState>((set, get) => ({
  artists: [],
  setArtists: (artists) => set({ artists }),
  ensureLoaded: async () => {
    if (get().artists.length > 0) return;
    try {
      const response = await fetch("/api/artists");
      if (!response.ok) return;
      const data = (await response.json()) as Artist[];
      set({ artists: data });
    } catch {
      return;
    }
  },
}));
