import "server-only";

const normalizeEmail = (value: string | undefined) =>
  String(value || "").trim().toLowerCase();

export function getAllowedAdminEmails(): string[] {
  return [process.env.ADMIN_EMAIL_1, process.env.ADMIN_EMAIL_2]
    .map(normalizeEmail)
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email || undefined);
  return normalized.length > 0 && getAllowedAdminEmails().includes(normalized);
}

export function hasFullAdminAccess(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email || undefined);
  return Boolean(normalized && normalized !== "servitecnico2@gmail.com");
}

export function adminAuthConfigured(): boolean {
  const emails = getAllowedAdminEmails();
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET &&
      new Set(emails).size === 2,
  );
}
