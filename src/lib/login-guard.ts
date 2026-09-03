import "server-only";

// In-memory per-IP throttle for the admin login endpoint. It persists only
// for the lifetime of a warm serverless instance, but it still meaningfully
// slows down scripted brute-force attempts against ADMIN_PASSWORD.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes to accumulate failures
const LOCK_MS = 15 * 60 * 1000; // lock duration once the limit is hit

type Entry = { failures: number; firstFailureAt: number; lockedUntil: number };
const attempts = new Map<string, Entry>();

function prune(now: number) {
  if (attempts.size < 500) return;
  for (const [key, entry] of attempts) {
    if (entry.lockedUntil < now && now - entry.firstFailureAt > WINDOW_MS) attempts.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export function isLoginLocked(ip: string): { locked: boolean; retryAfterSeconds: number } {
  const entry = attempts.get(ip);
  const now = Date.now();
  if (!entry || entry.lockedUntil <= now) return { locked: false, retryAfterSeconds: 0 };
  return { locked: true, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
}

export function registerLoginFailure(ip: string): void {
  const now = Date.now();
  prune(now);
  const entry = attempts.get(ip);
  if (!entry || now - entry.firstFailureAt > WINDOW_MS) {
    attempts.set(ip, { failures: 1, firstFailureAt: now, lockedUntil: 0 });
    return;
  }
  entry.failures += 1;
  if (entry.failures >= MAX_ATTEMPTS) entry.lockedUntil = now + LOCK_MS;
}

export function registerLoginSuccess(ip: string): void {
  attempts.delete(ip);
}
