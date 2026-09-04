"use client";

import { useState } from "react";

type Unit = "minutes" | "hours";

function splitMinutes(total: number): { value: string; unit: Unit } {
  if (total >= 60 && total % 60 === 0) {
    return { value: String(total / 60), unit: "hours" };
  }
  return { value: String(total), unit: "minutes" };
}

function toMinutes(value: string, unit: Unit): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  const minutes = unit === "hours" ? parsed * 60 : parsed;
  if (minutes < 1 || minutes > 7 * 24 * 60) return null;
  return Math.floor(minutes);
}

function IntervalRow({
  title,
  description,
  value,
  unit,
  onValue,
  onUnit,
}: {
  title: string;
  description: string;
  value: string;
  unit: Unit;
  onValue: (value: string) => void;
  onUnit: (unit: Unit) => void;
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 p-5">
      <p className="font-display text-base font-semibold uppercase tracking-[0.08em]">
        {title}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed opacity-70">
        {description}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={value}
          onChange={(event) => onValue(event.target.value)}
          aria-label={`${title} interval`}
          className="w-28 rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-[13px] outline-none focus:border-yellow"
        />
        <select
          value={unit}
          onChange={(event) => onUnit(event.target.value as Unit)}
          aria-label={`${title} unit`}
          className="cursor-pointer rounded-xl border border-foreground/15 bg-background px-4 py-2.5 text-[13px] outline-none focus:border-yellow"
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
        </select>
      </div>
    </div>
  );
}

export function SettingsClient({
  initialPlaylistMinutes,
  initialArtistMinutes,
  initialHaptics,
}: {
  initialPlaylistMinutes: number;
  initialArtistMinutes: number;
  initialHaptics: boolean;
}) {
  const playlist = splitMinutes(initialPlaylistMinutes);
  const artist = splitMinutes(initialArtistMinutes);
  const [playlistValue, setPlaylistValue] = useState(playlist.value);
  const [playlistUnit, setPlaylistUnit] = useState<Unit>(playlist.unit);
  const [artistValue, setArtistValue] = useState(artist.value);
  const [artistUnit, setArtistUnit] = useState<Unit>(artist.unit);
  const [haptics, setHaptics] = useState(initialHaptics);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const save = async () => {
    const playlistMinutes = toMinutes(playlistValue, playlistUnit);
    const artistMinutes = toMinutes(artistValue, artistUnit);
    if (playlistMinutes === null || artistMinutes === null) {
      setNotice("Enter a valid interval (1 minute to 7 days).");
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const entries: Array<[string, string]> = [
        ["playlist_sync_interval_minutes", String(playlistMinutes)],
        ["artist_sync_interval_minutes", String(artistMinutes)],
        ["haptics_enabled", haptics ? "true" : "false"],
      ];
      for (const [key, value] of entries) {
        const response = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
        if (!response.ok) throw new Error(`Could not save ${key}`);
      }
      setNotice("Settings saved.");
    } catch {
      setNotice("Could not save settings. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12">
      <p className="text-[10px] uppercase tracking-[0.28em] opacity-50">
        Yellow White Noise
      </p>
      <h1 className="mt-1 font-display text-3xl font-semibold uppercase tracking-[0.1em]">
        Settings
      </h1>

      <div className="mt-8 space-y-4">
        <IntervalRow
          title="Playlist refresh"
          description="How often imported playlists are re-checked for new tracks."
          value={playlistValue}
          unit={playlistUnit}
          onValue={setPlaylistValue}
          onUnit={setPlaylistUnit}
        />
        <IntervalRow
          title="Artist refresh"
          description="How often artist catalogs are re-checked for new releases."
          value={artistValue}
          unit={artistUnit}
          onValue={setArtistValue}
          onUnit={setArtistUnit}
        />

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-foreground/10 p-5">
          <div>
            <p className="font-display text-base font-semibold uppercase tracking-[0.08em]">
              Haptics
            </p>
            <p className="mt-1 text-[11px] leading-relaxed opacity-70">
              Subtle vibration when tapping artists, tracks and navigation on
              phones.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={haptics}
            aria-label="Haptics"
            onClick={() => setHaptics((current) => !current)}
            className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
              haptics ? "bg-yellow" : "bg-foreground/20"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-black transition-all ${
                haptics ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {notice && <p className="text-[12px] opacity-70">{notice}</p>}
      </div>
    </main>
  );
}
