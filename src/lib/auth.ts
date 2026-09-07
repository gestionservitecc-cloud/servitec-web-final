import "server-only";
import { auth } from "@/auth";
import { adminAuthConfigured, isAllowedAdminEmail } from "./admin-access";

export { adminAuthConfigured as adminConfigured };

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return isAllowedAdminEmail(session.user.email) ? session : null;
}

export async function isAuthed(): Promise<boolean> {
  return Boolean(await requireAdmin());
}
