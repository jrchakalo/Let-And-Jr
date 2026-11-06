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

export function rateLimit(
  key: string,
  max = MAX_ATTEMPTS,
  windowMs = WINDOW_MS
): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  bucket.count += 1;
  if (bucket.count > max) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true };
}

/** Timing-safe string comparison (avoid leaking the password via timing). */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function samePassword(req: Request, password: string): NextResponse | null {
  const rl = rateLimit(`login:${clientIp(req)}`);
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
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  return null;
}
