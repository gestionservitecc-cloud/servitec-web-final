import { adminConfigured, requireAdmin } from "@/lib/auth";
import { hasFullAdminAccess } from "@/lib/admin-access";
import { storeIsPersistent } from "@/lib/store";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = adminConfigured();
  const session = configured ? await requireAdmin() : null;

  if (!session) {
    return <AdminLogin configured={configured} />;
  }

  return (
    <AdminDashboard
      persistent={storeIsPersistent()}
      canManageCatalog={hasFullAdminAccess(session.user?.email)}
    />
  );
}
