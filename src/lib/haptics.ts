"use client";

let cached: boolean | null = null;
let pending: Promise<boolean> | null = null;

function loadEnabled(): Promise<boolean> {
  if (cached !== null) return Promise.resolve(cached);
  if (!pending) {
    pending = fetch("/api/public/settings")
      .then((response) => response.json())
      .then((data: unknown) => {
        const enabled =
          typeof data === "object" &&
          data !== null &&
          (data as { hapticsEnabled?: unknown }).hapticsEnabled !== false;
        cached = enabled;
        return enabled;
      })
      .catch(() => {
        cached = false;
        return false;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

if (typeof window !== "undefined") {
  void loadEnabled();
}

/** Subtle vibration on user taps when the admin has haptics enabled. */
export function triggerHaptic(pattern: number | number[] = 10): void {
  if (typeof window === "undefined" || !("vibrate" in navigator)) return;
  void loadEnabled().then((enabled) => {
    if (enabled) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibration not supported — stay silent.
      }
    }
  });
}
