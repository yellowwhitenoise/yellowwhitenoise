"use client";

import { useState } from "react";

export function SubscribeForm({
  onSuccess,
  playlistSlug,
}: {
  onSuccess?: () => void;
  playlistSlug?: string;
}) {
  const [email, setEmail] = useState("");
  const [globalUpdates, setGlobalUpdates] = useState(!playlistSlug);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        ...(playlistSlug ? { playlistSlug, globalUpdates } : {}),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    setBusy(false);
    if (response.ok) {
      setDone(true);
      setMessage(data.message ?? "You're in.");
      onSuccess?.();
    } else {
      setMessage(data.error ?? "Something went wrong.");
    }
  };

  if (done) {
    return (
      <p className="text-[12px] leading-relaxed text-yellow">{message}</p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="min-w-0 flex-1 rounded-full border border-foreground/15 bg-transparent px-4 py-2.5 text-[13px] outline-none focus:border-yellow"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? "…" : "Subscribe"}
        </button>
      </div>
      {playlistSlug && (
        <label className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed opacity-65">
          <input
            type="checkbox"
            checked={globalUpdates}
            onChange={(event) => setGlobalUpdates(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-yellow"
          />
          Also send all Yellow White Noise release updates
        </label>
      )}
      {message && (
        <p className="mt-2 text-[11px] text-red-400">{message}</p>
      )}
    </form>
  );
}
