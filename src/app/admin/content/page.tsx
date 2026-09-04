import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getSiteContent } from "@/lib/db";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { ContentEditor } from "@/components/admin/ContentEditor";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const content: SiteContent = {
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

  return <ContentEditor initial={content} />;
}
