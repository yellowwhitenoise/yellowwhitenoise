import type { Metadata } from "next";
import { InfoSections } from "@/components/InfoSections";
import { getSiteContent } from "@/lib/db";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy & Legal",
  description:
    "Privacy policy of Yellow White Noise — how data is collected, used and protected, and your rights under the GDPR.",
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy", title: "Privacy & Legal" },
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

export default async function PrivacyPage() {
  const content = await getContent();

  return <InfoSections initialSection="legal" initialPosts={[]} content={content} />;
}
