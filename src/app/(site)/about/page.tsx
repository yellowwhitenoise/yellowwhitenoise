import type { Metadata } from "next";
import { InfoSections } from "@/components/InfoSections";
import { getSiteContent } from "@/lib/db";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of Yellow White Noise — an independent label home for Amapiano and Afrobeats artists. Contact, blog, and legal.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", title: "About" },
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
    socials:
      getSiteContent<SiteContent["socials"]>("socials") ??
      defaultSiteContent.socials,
  };
}

export default async function AboutPage() {
  const content = await getContent();

  return <InfoSections initialSection="about" initialPosts={[]} content={content} />;
}
