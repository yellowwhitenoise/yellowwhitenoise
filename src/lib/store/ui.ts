import { create } from "zustand";
import { usePlaybackStore } from "./playback";

interface UIState {
  sheetArtistSlug: string | null;
  immersed: boolean;
  hoveredArtistSlug: string | null;
  chromeHidden: boolean;
  openSheet: (slug: string) => void;
  closeSheet: () => void;
  setImmersed: (immersed: boolean) => void;
  toggleImmersed: () => void;
  setHoveredArtist: (slug: string | null) => void;
  setChromeHidden: (hidden: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sheetArtistSlug: null,
  immersed: false,
  hoveredArtistSlug: null,
  chromeHidden: false,
  openSheet: (slug) => set({ sheetArtistSlug: slug }),
  closeSheet: () => {
    usePlaybackStore.getState().stop();
    set({ sheetArtistSlug: null });
  },
  setImmersed: (immersed) => set({ immersed }),
  toggleImmersed: () => set((state) => ({ immersed: !state.immersed })),
  setHoveredArtist: (hoveredArtistSlug) => set({ hoveredArtistSlug }),
  setChromeHidden: (chromeHidden) => set({ chromeHidden }),
}));
