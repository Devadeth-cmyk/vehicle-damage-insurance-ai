import { SessionUser, AuthSession } from "@/types/auth";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "autoinsight_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "autoinsight-secure-session-key-dev-environment-2026";
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to get crypto key using Web Crypto API (supported in Edge and Node)
async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SESSION_SECRET);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(data: Uint8Array | string): string {
  const str = typeof data === "string" ? Buffer.from(data, "utf-8").toString("base64") : Buffer.from(data).toString("base64");
  return str.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Creates a signed session token
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  const session: AuthSession = {
    user,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const payloadStr = JSON.stringify(session);
  const payloadEncoded = base64UrlEncode(payloadStr);

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadEncoded)
  );
  const signatureEncoded = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${payloadEncoded}.${signatureEncoded}`;
}

/**
 * Verifies a signed session token and returns the session if valid
 */
export async function verifySessionToken(token: string | undefined | null): Promise<AuthSession | null> {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadEncoded, signatureEncoded] = parts;
    const key = await getCryptoKey();

    // Recompute signature to verify
    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payloadEncoded)
    );
    const expectedSignatureEncoded = base64UrlEncode(new Uint8Array(expectedSignature));

    if (signatureEncoded !== expectedSignatureEncoded) {
      return null;
    }

    const payloadStr = base64UrlDecode(payloadEncoded);
    const session = JSON.parse(payloadStr) as AuthSession;

    if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies current user from cookies in Server Components / Route Handlers
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    return session?.user || null;
  } catch {
    return null;
  }
}

/**
 * Sets session cookie on a NextResponse object
 */
export function setSessionCookieOnResponse(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

/**
 * Clears session cookie on a NextResponse object
 */
export function clearSessionCookieOnResponse(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Inspect session from NextRequest (for middleware)
 */
export async function getSessionFromRequest(request: NextRequest): Promise<AuthSession | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
