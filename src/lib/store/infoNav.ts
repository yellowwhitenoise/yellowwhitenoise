import { create } from "zustand";

export type InfoSectionId = "about" | "contact" | "blog" | "legal";

interface InfoNavState {
  section: InfoSectionId;
  /** True once InfoSections has reported at least once (so the store
   *  is fresher than the pathname, e.g. after in-page tab switches). */
  touched: boolean;
  setSection: (section: InfoSectionId) => void;
  reset: () => void;
}

export const useInfoNavStore = create<InfoNavState>((set) => ({
  section: "about",
  touched: false,
  setSection: (section) => set({ section, touched: true }),
  reset: () => set({ section: "about", touched: false }),
}));

export function infoSectionFromPath(pathname: string): InfoSectionId {
  if (pathname.startsWith("/contact")) return "contact";
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/privacy")) return "legal";
  return "about";
}

export const INFO_NAV_META: Record<
  InfoSectionId,
  { label: string; href: string }
> = {
  about: { label: "About", href: "/about" },
  contact: { label: "Contact", href: "/contact" },
  blog: { label: "Blog", href: "/blog" },
  legal: { label: "Privacy", href: "/privacy" },
};
