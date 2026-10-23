import { cookies } from "next/headers";
import crypto from "crypto";
import { COOKIE_MAX_AGE, COOKIE_NAME_ADMIN } from "./constants";

const SECRET_SALT = process.env.ADMIN_SECRET_KEY || "aura-mart-secret-fallback-key";

// Cryptographic Password Hashing (scrypt + random salt)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Session Token Creation & Verification
export function createSessionToken(payload: { id: string; username: string; email: string }): string {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + COOKIE_MAX_AGE * 1000,
  });
  const encoded = Buffer.from(data).toString("base64url");
  const signature = crypto.createHmac("sha256", SECRET_SALT).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): { id: string; username: string; email: string } | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expectedSig = crypto.createHmac("sha256", SECRET_SALT).update(encoded).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const payload = JSON.parse(json);

    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

// Fallback legacy secret token
export function getExpectedAdminToken(): string {
  return crypto.createHash("sha256").update(SECRET_SALT).digest("hex");
}

export function verifyAdminAuth(): boolean {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME_ADMIN);
    if (!sessionCookie || !sessionCookie.value) {
      return false;
    }

    // 1. Check if it's a signed user session token
    const user = verifySessionToken(sessionCookie.value);
    if (user) {
      return true;
    }

    // 2. Check legacy passcode hash
    const expectedToken = getExpectedAdminToken();
    return sessionCookie.value === expectedToken;
  } catch {
    return false;
  }
}

export function getAdminSessionUser(): { id: string; username: string; email: string } | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME_ADMIN);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(payload?: { id: string; username: string; email: string }): void {
  const cookieStore = cookies();
  const token = payload ? createSessionToken(payload) : getExpectedAdminToken();
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
