import crypto from "node:crypto";
import { NextResponse } from "next/server";

/** Client IP best-effort (Vercel sets these headers). */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// In-memory sliding window. Resets per serverless instance — good
// enough to slow brute force; Vercel WAF rules can add global limits.
const buckets = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 5;

/** Peek at the bucket without registering an attempt (usable on success). */
function rateLimitPeek(key: string, max = MAX_ATTEMPTS): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) return { ok: true };
  if (bucket.count >= max) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true };
}

/** Register a failed attempt against the bucket. */
function rateLimitHit(key: string, windowMs = WINDOW_MS): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
}

/** Timing-safe string comparison (avoid leaking the password via timing). */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Verifies the admin password with a timing-safe comparison and a
 * per-IP rate limit that only counts FAILED attempts — successful
 * logins never consume the budget.
 */
export function samePassword(req: Request, password: string): NextResponse | null {
  const key = `login:${clientIp(req)}`;

  const rl = rateLimitPeek(key);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  if (
    !password ||
    !process.env.ADMIN_PASSWORD ||
    !safeEqual(password, process.env.ADMIN_PASSWORD)
  ) {
    rateLimitHit(key);
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  return null;
}
