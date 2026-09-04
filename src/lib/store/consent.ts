import { create } from "zustand";

export type ConsentStatus = "unknown" | "accepted" | "declined";

interface ConsentState {
  status: ConsentStatus;
  hydrated: boolean;
  hydrate: () => void;
  accept: () => void;
  decline: () => void;
}

const STORAGE_KEY = "ywn-cookie-consent";

export const useConsentStore = create<ConsentState>((set) => ({
  status: "unknown",
  hydrated: false,
  hydrate: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    set({
      status:
        stored === "accepted" || stored === "declined" ? stored : "unknown",
      hydrated: true,
    });
  },
  accept: () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    set({ status: "accepted" });
  },
  decline: () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    set({ status: "declined" });
  },
}));

export function getCookieConsent(): ConsentStatus {
  return useConsentStore.getState().status;
}
