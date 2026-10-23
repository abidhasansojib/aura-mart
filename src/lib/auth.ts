import { cookies } from "next/headers";
import crypto from "crypto";
import { COOKIE_MAX_AGE, COOKIE_NAME_ADMIN } from "./constants";

export function getExpectedAdminToken(): string {
  const secret = process.env.ADMIN_SECRET_KEY || "fallback-secret-key-change-me";
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function verifyAdminAuth(): boolean {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME_ADMIN);
    if (!sessionCookie || !sessionCookie.value) {
      return false;
    }
    const expectedToken = getExpectedAdminToken();
    return sessionCookie.value === expectedToken;
  } catch {
    return false;
  }
}

export function setAdminSessionCookie(): void {
  const cookieStore = cookies();
  const token = getExpectedAdminToken();
  cookieStore.set(COOKIE_NAME_ADMIN, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearAdminSessionCookie(): void {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME_ADMIN);
}
