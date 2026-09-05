"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (response.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(data.error ?? "Login failed.");
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-foreground/10 p-8"
      >
        <div className="flex justify-center">
          <Link href="/" aria-label="Yellow White Noise — Home">
            <Wordmark className="h-14 w-auto max-w-[110px] object-contain" />
          </Link>
        </div>
        <h1 className="mt-4 text-center font-display text-2xl font-semibold uppercase tracking-[0.1em]">
          Admin
        </h1>

        <label className="mt-8 block text-[10px] uppercase tracking-[0.22em] opacity-50">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="mt-2 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-[13px] tracking-normal text-foreground outline-none focus:border-yellow"
          />
        </label>
        <label className="mt-5 block text-[10px] uppercase tracking-[0.22em] opacity-50">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="mt-2 w-full rounded-xl border border-foreground/15 bg-transparent px-4 py-2.5 text-[13px] tracking-normal text-foreground outline-none focus:border-yellow"
          />
        </label>

        {error && (
          <p className="mt-4 text-[12px] text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-8 w-full cursor-pointer rounded-full bg-foreground px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
