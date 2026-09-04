import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { listSubscribers } from "@/lib/db";
import { SubscriberManagerClient } from "@/components/admin/SubscriberManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <SubscriberManagerClient initial={listSubscribers()} />;
}
