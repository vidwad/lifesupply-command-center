/**
 * Abuse controls for the public intake (guide §5 inquiry contract).
 *
 * - Origin check: a browser POST must come from an allowed public origin
 *   (`PUBLIC_SITE_ORIGINS`, comma-separated, plus the Command Center's own
 *   origin). Requests with no Origin and no Referer are refused too: the
 *   public form always sends one, and a bare script should not pass.
 * - Rate limit: a fixed window per hashed client address, in process
 *   memory. This protects a single Render instance; a shared limiter is a
 *   Stage 9 hardening item and is recorded as such. The raw address is
 *   never kept.
 * - Body size: refused above a small ceiling before parsing.
 */

export const MAX_BODY_BYTES = 16 * 1024;
export const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 } as const;

export function allowedOrigins(env: Record<string, string | undefined> = process.env): string[] {
  const configured = (env.PUBLIC_SITE_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const self = env.NEXT_PUBLIC_COMMAND_CENTER_URL?.trim();
  const origins = [...configured, ...(self ? [self] : [])]
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return null;
      }
    })
    .filter((value): value is string => value !== null);
  if (env.NODE_ENV !== "production") origins.push("http://localhost:3000", "http://127.0.0.1:3100");
  return Array.from(new Set(origins));
}

/** True when the request's Origin (or, failing that, Referer) is an allowed public origin. */
export function isAllowedOrigin(
  headers: Headers,
  env: Record<string, string | undefined> = process.env,
) {
  const origins = allowedOrigins(env);
  const origin = headers.get("origin");
  if (origin) return origins.includes(origin);
  const referer = headers.get("referer");
  if (!referer) return false;
  try {
    return origins.includes(new URL(referer).origin);
  } catch {
    return false;
  }
}

/** First hop of x-forwarded-for, else x-real-ip, else "unknown". Only ever hashed. */
export function clientAddress(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

type Bucket = { windowStart: number; count: number };

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs: number = RATE_LIMIT.windowMs,
    private readonly max: number = RATE_LIMIT.max,
  ) {}

  /** Returns true when the key is within its allowance for the current window. */
  allow(key: string, now = Date.now()): boolean {
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStart >= this.windowMs) {
      this.buckets.set(key, { windowStart: now, count: 1 });
      this.sweep(now);
      return true;
    }
    if (bucket.count >= this.max) return false;
    bucket.count += 1;
    return true;
  }

  private sweep(now: number) {
    if (this.buckets.size < 5000) return;
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.windowStart >= this.windowMs) this.buckets.delete(key);
    }
  }
}

/** Process-wide limiter for the intake route. */
export const intakeRateLimiter = new FixedWindowRateLimiter();
