import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getSetting, listCampaigns } from "@/lib/db";
import { AdvertisingClient } from "@/components/admin/AdvertisingClient";

export const dynamic = "force-dynamic";

export default async function AdminAdvertisingPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <AdvertisingClient
      initialCampaigns={listCampaigns()}
      autoAdsEnabled={getSetting("auto_ads") !== "false"}
    />
  );
}
