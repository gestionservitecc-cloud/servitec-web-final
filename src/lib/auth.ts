import "server-only";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "st_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function key() {
  const secret = process.env.ADMIN_PASSWORD || "";
  const material = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(`servitec-admin::${secret}`),
  );
  return crypto.subtle.importKey(
    "raw",
    material,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(payload: string) {
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

async function verify(token: string): Promise<boolean> {
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const expected = await sign(payload);
  if (expected !== token) return false;
  const [, expStr] = payload.split("|");
  return Number(expStr) > Date.now();
}

/** True when an admin password is configured for this deployment. */
export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Compares fixed-length digests (not the raw strings) so the check takes the
// same time regardless of the submitted password's length or content.
export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  const [expectedHash, inputHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
    crypto.subtle.digest("SHA-256", enc.encode(input)),
  ]);
  return timingSafeEqualBytes(new Uint8Array(expectedHash), new Uint8Array(inputHash));
}

export async function createSessionCookie() {
  const payload = `admin|${Date.now() + MAX_AGE * 1000}`;
  const token = await sign(payload);
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(AUTH_COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return false;
  return verify(token);
}
