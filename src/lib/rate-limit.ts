import { NextRequest } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory sliding window store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes to prevent memory leaks
let gcInterval: NodeJS.Timeout | null = null;
function ensureGarbageCollector() {
  if (gcInterval) return;
  gcInterval = setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      // Keep only timestamps within 1 hour
      const valid = record.timestamps.filter((ts) => now - ts < 3600000);
      if (valid.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, { timestamps: valid });
      }
    });
  }, 300000);
  if (gcInterval.unref) gcInterval.unref();
}

/**
 * Extract client IP safely from NextRequest headers
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Sliding window rate limiter
 * @param key Unique key (e.g., `forgot-password:192.168.1.1` or `reset:admin`)
 * @param limit Maximum allowed hits within window
 * @param windowSeconds Window length in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { success: boolean; remaining: number; resetInSeconds: number } {
  ensureGarbageCollector();

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  const record = rateLimitStore.get(key) || { timestamps: [] };
  // Filter out timestamps outside window
  const activeTimestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });

  return {
    success: true,
    remaining: limit - activeTimestamps.length,
    resetInSeconds: windowSeconds,
  };
}
