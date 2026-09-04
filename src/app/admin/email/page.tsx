import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getEmailTemplates } from "@/lib/email-template-store";
import { EmailTemplatesClient } from "@/components/admin/EmailTemplatesClient";

export const dynamic = "force-dynamic";

export default async function AdminEmailPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <EmailTemplatesClient
      initial={getEmailTemplates()}
      logoUrl={process.env.EMAIL_LOGO_URL?.trim() || undefined}
    />
  );
}
