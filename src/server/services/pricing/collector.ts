/**
 * DP-3 read-only competitor page fetching.
 *
 * This is the ONLY module in the pricing tree permitted to make outbound
 * requests, and the pricing canaries assert that. Everything it does is a plain
 * GET of a product URL that LifeSupply has explicitly configured or uploaded.
 *
 * Hard limits, all enforced here rather than trusted to callers:
 *  - GET only. No POST, no form submission, no cart, checkout, or account flow.
 *  - No credentials. No cookie jar, no Authorization header, credentials omitted.
 *  - http/https only, and redirects are not followed, so a page cannot bounce
 *    the fetcher onto a host that never passed terms review.
 *  - A response-size cap and a timeout, so one bad page cannot stall a batch.
 *  - An identifying User-Agent with a contact URL: a site operator who wants
 *    this traffic to stop must be able to tell who it is.
 *  - robots.txt is honoured per host. A Disallow that covers the path refuses
 *    the fetch even when terms review said allowed — the two are independent
 *    signals and either one can veto.
 *
 * There is deliberately no CAPTCHA handling, no bot-protection evasion, no
 * headless browser, and no login. A page that will not serve a plain GET is
 * recorded as failed and left alone.
 */

const USER_AGENT =
  "LifeSupplyCommandCenter-PriceCheck/1.0 (+https://lifesupply.ca; read-only price comparison)";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 2_000_000;
const ROBOTS_TIMEOUT_MS = 5_000;

export type FetchOutcome =
  | { ok: true; html: string; httpStatus: number; finalUrl: string }
  | { ok: false; httpStatus: number | null; reason: string };

export function isPublicHttpUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  // Refuse anything that could reach internal infrastructure. A competitor URL
  // is by definition on the public internet.
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    host.endsWith(".local") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.startsWith("[")
  ) {
    return false;
  }
  return true;
}

/**
 * Minimal robots.txt evaluation: the longest matching Disallow wins, and an
 * equally specific Allow beats it. Deliberately simple — when robots.txt cannot
 * be read the fetch is permitted, because an unreachable robots file is not a
 * prohibition, but any Disallow we DO understand is obeyed.
 */
export function isAllowedByRobots(robotsTxt: string, path: string): boolean {
  const lines = robotsTxt.split(/\r?\n/).map((line) => line.replace(/#.*$/, "").trim());
  let applies = false;
  let bestDisallow = -1;
  let bestAllow = -1;

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      applies = value === "*" || value.toLowerCase().includes("lifesupply");
      continue;
    }
    if (!applies || !value) continue;
    if (key === "disallow" && path.startsWith(value)) {
      bestDisallow = Math.max(bestDisallow, value.length);
    }
    if (key === "allow" && path.startsWith(value)) {
      bestAllow = Math.max(bestAllow, value.length);
    }
  }
  if (bestDisallow < 0) return true;
  return bestAllow >= bestDisallow;
}

const robotsCache = new Map<string, string | null>();

async function loadRobots(origin: string): Promise<string | null> {
  if (robotsCache.has(origin)) return robotsCache.get(origin) ?? null;
  let body: string | null = null;
  try {
    // Manual redirect handling: a cross-origin robots redirect must never be
    // able to authorise checking a competitor URL, because the file that
    // granted permission would then belong to a different site entirely.
    let current = origin + "/robots.txt";
    for (let hop = 0; hop < 2; hop += 1) {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        headers: { "User-Agent": USER_AGENT, Accept: "text/plain" },
        signal: AbortSignal.timeout(ROBOTS_TIMEOUT_MS),
        cache: "no-store",
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        const next = location ? new URL(location, current) : null;
        // Same-origin redirects are followed once; anything else is refused
        // and treated as "no robots file we can trust".
        if (!next || next.origin !== origin) break;
        current = next.toString();
        continue;
      }
      body = response.ok ? (await response.text()).slice(0, 200_000) : null;
      break;
    }
  } catch {
    body = null;
  }
  robotsCache.set(origin, body);
  return body;
}

/** Clears the per-process robots cache. Used by tests. */
export function resetRobotsCache(): void {
  robotsCache.clear();
}

/**
 * Reads a response body, stopping as soon as the cap is exceeded.
 *
 * Returns null rather than a truncated page: a half-read document can produce a
 * plausible but wrong extraction, and a refusal is recoverable while a wrong
 * price is not. Falls back to a buffered read only when the body cannot be
 * streamed, and still refuses on size.
 */
async function readCapped(response: Response): Promise<string | null> {
  const body = response.body;
  if (!body) {
    const text = await response.text();
    return text.length > MAX_RESPONSE_BYTES ? null : text;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
  } finally {
    reader.releaseLock();
  }
  chunks.push(decoder.decode());
  return chunks.join("");
}

/** Fetches one competitor product page read-only, or explains why it did not. */
export async function fetchCompetitorPage(rawUrl: string): Promise<FetchOutcome> {
  if (!isPublicHttpUrl(rawUrl)) {
    return { ok: false, httpStatus: null, reason: "URL is not a public http(s) address." };
  }
  const url = new URL(rawUrl);

  const robots = await loadRobots(url.origin);
  if (robots && !isAllowedByRobots(robots, url.pathname)) {
    return {
      ok: false,
      httpStatus: null,
      reason: "robots.txt disallows this path for our user agent.",
    };
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      // Not followed: a redirect could land on a host that never passed terms
      // review, and the observation would then be attributed to the wrong site.
      redirect: "manual",
      credentials: "omit",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-CA,en;q=0.9",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.status >= 300 && response.status < 400) {
      return {
        ok: false,
        httpStatus: response.status,
        reason: "Page redirected; update the configured URL rather than following it.",
      };
    }
    if (!response.ok) {
      return { ok: false, httpStatus: response.status, reason: "HTTP " + response.status };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      return { ok: false, httpStatus: response.status, reason: "Response is not HTML." };
    }

    // Refuse before reading when the server declares an oversized body:
    // slicing after response.text() would already have pulled the whole page
    // into memory, which is what the cap exists to prevent.
    const declared = Number(response.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) {
      return {
        ok: false,
        httpStatus: response.status,
        reason: "Response is larger than the " + String(MAX_RESPONSE_BYTES) + " byte cap.",
      };
    }

    const html = await readCapped(response);
    if (html == null) {
      return {
        ok: false,
        httpStatus: response.status,
        reason: "Response exceeded the " + String(MAX_RESPONSE_BYTES) + " byte cap while reading.",
      };
    }

    return { ok: true, html, httpStatus: response.status, finalUrl: url.toString() };
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      reason: error instanceof Error ? error.message.slice(0, 300) : "Request failed.",
    };
  }
}
