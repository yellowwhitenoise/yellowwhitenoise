import type { Metadata } from "next";
import { InfoSections } from "@/components/InfoSections";
import { getSiteContent } from "@/lib/db";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Yellow White Noise — general inquiries, demo submissions and bookings.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact", title: "Contact" },
};

async function getContent(): Promise<SiteContent> {
  if (isBackendConfigured()) {
    const remote =
      await fetchBackendJson<SiteContent>("/api/public/site-content");
    if (remote) return remote;
  }
  return {
    about:
      getSiteContent<SiteContent["about"]>("about") ??
      defaultSiteContent.about,
    contact:
      getSiteContent<SiteContent["contact"]>("contact") ??
      defaultSiteContent.contact,
    legal:
      getSiteContent<SiteContent["legal"]>("legal") ??
      defaultSiteContent.legal,
  };
}

export default async function ContactPage() {
  const content = await getContent();

  return <InfoSections initialSection="contact" initialPosts={[]} content={content} />;
}
