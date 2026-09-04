"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AD_SLOTS } from "@/lib/blocks";

interface Campaign {
  id: number;
  name: string;
  advertiser: string;
  creative_type: string;
  creative_html: string;
  image_url: string;
  link_url: string;
  alt: string;
  slots: string;
  targeting: string;
  priority: number;
  active: number;
}

interface CampaignDraft {
  name: string;
  advertiser: string;
  creativeType: "html" | "image";
  creativeHtml: string;
  imageUrl: string;
  linkUrl: string;
  alt: string;
  slots: string[];
  countries: string;
  devices: string;
  visitorTypes: string;
  categories: string;
  tags: string;
  topics: string;
  priority: number;
  active: boolean;
}

const emptyDraft: CampaignDraft = {
  name: "",
  advertiser: "",
  creativeType: "html",
  creativeHtml: "",
  imageUrl: "",
  linkUrl: "",
  alt: "",
  slots: ["article_mid"],
  countries: "",
  devices: "",
  visitorTypes: "",
  categories: "",
  tags: "",
  topics: "",
  priority: 0,
  active: true,
};

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow";

function toDraft(campaign: Campaign): CampaignDraft {
  let slots: string[] = [];
  let targeting: Record<string, string[]> = {};
  try {
    slots = JSON.parse(campaign.slots) as string[];
  } catch {
    slots = [];
  }
  try {
    targeting = JSON.parse(campaign.targeting) as Record<string, string[]>;
  } catch {
    targeting = {};
  }
  return {
    name: campaign.name,
    advertiser: campaign.advertiser,
    creativeType: campaign.creative_type === "image" ? "image" : "html",
    creativeHtml: campaign.creative_html,
    imageUrl: campaign.image_url,
    linkUrl: campaign.link_url,
    alt: campaign.alt,
    slots,
    countries: (targeting.countries ?? []).join(", "),
    devices: (targeting.devices ?? []).join(", "),
    visitorTypes: (targeting.visitorTypes ?? []).join(", "),
    categories: (targeting.categories ?? []).join(", "),
    tags: (targeting.tags ?? []).join(", "),
    topics: (targeting.topics ?? []).join(", "),
    priority: campaign.priority,
    active: campaign.active === 1,
  };
}

export function AdvertisingClient({
  initialCampaigns,
  autoAdsEnabled: initialAutoAds,
}: {
  initialCampaigns: Campaign[];
  autoAdsEnabled: boolean;
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [autoAds, setAutoAds] = useState(initialAutoAds);
  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const toggleAutoAds = async () => {
    const next = !autoAds;
    setAutoAds(next);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "auto_ads", value: next ? "true" : "false" }),
    });
  };

  const startEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setDraft(toDraft(campaign));
    setNotice(null);
  };

  const startCreate = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft });
    setNotice(null);
  };

  const saveDraft = async () => {
    if (!draft) return;
    const payload = {
      name: draft.name,
      advertiser: draft.advertiser,
      creativeType: draft.creativeType,
      creativeHtml: draft.creativeHtml,
      imageUrl: draft.imageUrl,
      linkUrl: draft.linkUrl,
      alt: draft.alt,
      slots: draft.slots,
      targeting: {
        countries: draft.countries.split(",").map((v) => v.trim()).filter(Boolean),
        devices: draft.devices.split(",").map((v) => v.trim()).filter(Boolean),
        visitorTypes: draft.visitorTypes.split(",").map((v) => v.trim()).filter(Boolean),
        categories: draft.categories.split(",").map((v) => v.trim()).filter(Boolean),
        tags: draft.tags.split(",").map((v) => v.trim()).filter(Boolean),
        topics: draft.topics.split(",").map((v) => v.trim()).filter(Boolean),
      },
      priority: draft.priority,
      active: draft.active,
    };
    const response = await fetch(
      editingId ? `/api/admin/campaigns/${editingId}` : "/api/admin/campaigns",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (response.ok) {
      setDraft(null);
      setEditingId(null);
      router.refresh();
      const fresh = await fetch("/api/admin/campaigns");
      if (fresh.ok) setCampaigns((await fresh.json()) as Campaign[]);
      setNotice("Campaign saved.");
    } else {
      setNotice("Save failed.");
    }
  };

  const removeCampaign = async (id: number) => {
    await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((current) => current.filter((c) => c.id !== id));
  };

  const draftField = (
    label: string,
    key: keyof CampaignDraft,
    placeholder?: string,
  ) => (
    <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50">
      {label}
      <input
        value={String((draft?.[key] as string | number | undefined) ?? "")}
        onChange={(e) =>
          setDraft((current) =>
            current ? { ...current, [key]: e.target.value } : current,
          )
        }
        placeholder={placeholder}
        className={`mt-2 ${inputClass}`}
      />
    </label>
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12">
      <Link
        href="/admin"
        className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
      >
        ← Dashboard
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.1em]">
          Advertising
        </h1>
        <button
          type="button"
          onClick={startCreate}
          className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85"
        >
          + Campaign
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-foreground/10 p-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-60">
            Automatic ad placement
          </p>
          <p className="mt-1 text-[11px] opacity-45">
            Inserts ads every 4 paragraphs, every 3 H2 sections and at mid-depth.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleAutoAds}
          className={`flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors ${
            autoAds ? "bg-yellow" : "bg-foreground/20"
          }`}
          aria-pressed={autoAds}
        >
          <span
            className={`h-5 w-5 rounded-full bg-background shadow transition-transform ${
              autoAds ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {draft && (
        <section className="mt-8 rounded-2xl border border-foreground/10 p-5">
          <h2 className="text-[11px] uppercase tracking-[0.22em] opacity-50">
            {editingId ? "Edit campaign" : "New campaign"}
          </h2>
          <div className="mt-4 grid gap-3">
            {draftField("Campaign name", "name", "Summer Amapiano push")}
            {draftField("Advertiser", "advertiser", "Internal / Sponsor")}
            <div className="flex items-center gap-3">
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">
                Creative type
              </p>
              <div className="flex gap-2">
                {(["html", "image"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setDraft((current) =>
                        current ? { ...current, creativeType: option } : current,
                      )
                    }
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                      draft.creativeType === option
                        ? "bg-foreground text-background"
                        : "border border-foreground/15 opacity-60"
                    }`}
                  >
                    {option === "html" ? "HTML" : "Image + link"}
                  </button>
                ))}
              </div>
            </div>
            {draft.creativeType === "html" ? (
              <label className="block text-[10px] uppercase tracking-[0.2em] opacity-50">
                Creative HTML
                <textarea
                  value={draft.creativeHtml}
                  onChange={(e) =>
                    setDraft((current) =>
                      current ? { ...current, creativeHtml: e.target.value } : current,
                    )
                  }
                  rows={4}
                  className={`mt-2 ${inputClass} resize-y font-mono text-[11px]`}
                />
              </label>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {draftField("Image URL", "imageUrl", "https://…")}
                {draftField("Click link", "linkUrl", "https://…")}
                {draftField("Alt text", "alt", "Description")}
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">
                Ad slots
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {AD_SLOTS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() =>
                      setDraft((current) => {
                        if (!current) return current;
                        const slots = current.slots.includes(entry.id)
                          ? current.slots.filter((slot) => slot !== entry.id)
                          : [...current.slots, entry.id];
                        return { ...current, slots };
                      })
                    }
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] transition-colors ${
                      draft.slots.includes(entry.id)
                        ? "bg-yellow/20 text-yellow"
                        : "border border-foreground/15 opacity-60"
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {draftField("Countries (comma-separated)", "countries", "NG, ZA, GB")}
              {draftField("Devices", "devices", "mobile, desktop")}
              {draftField("Visitor types", "visitorTypes", "new, returning")}
              {draftField("Categories", "categories", "Music")}
              {draftField("Tags", "tags", "Amapiano, Afrobeats")}
              {draftField("Topics", "topics", "After-hours")}
              {draftField("Priority (higher wins)", "priority", "0")}
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-[12px]">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                  setDraft((current) =>
                    current ? { ...current, active: e.target.checked } : current,
                  )
                }
                className="h-4 w-4 accent-[#f0b429]"
              />
              Active
            </label>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDraft(null);
                  setEditingId(null);
                }}
                className="flex-1 cursor-pointer rounded-full border border-foreground/20 px-4 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-foreground/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDraft}
                className="flex-1 cursor-pointer rounded-full bg-foreground px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85"
              >
                Save campaign
              </button>
            </div>
          </div>
        </section>
      )}

      {notice && <p className="mt-6 text-[12px] text-yellow">{notice}</p>}

      <section className="mt-10">
        <h2 className="text-[11px] uppercase tracking-[0.22em] opacity-50">
          Campaigns
        </h2>
        {campaigns.length === 0 ? (
          <p className="mt-4 text-[12px] opacity-50">
            No campaigns yet. Create one and target it to ad slots across your
            articles.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-foreground/10">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">
                    {campaign.name}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] opacity-40">
                    priority {campaign.priority} ·{" "}
                    {campaign.active === 1 ? "active" : "paused"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(campaign)}
                  className="cursor-pointer text-[10px] uppercase tracking-[0.18em] underline underline-offset-4 opacity-70 hover:opacity-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeCampaign(campaign.id)}
                  className="cursor-pointer text-[10px] uppercase tracking-[0.18em] text-red-400/80 underline underline-offset-4 hover:text-red-400"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
