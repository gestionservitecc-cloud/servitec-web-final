import { adminConfigured, isAuthed } from "@/lib/auth";
import { storeIsPersistent } from "@/lib/store";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = adminConfigured();
  const authed = configured && (await isAuthed());

  if (!authed) {
    return <AdminLogin configured={configured} />;
  }

  return <AdminDashboard persistent={storeIsPersistent()} />;
}
