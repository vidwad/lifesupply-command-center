/**
 * Best Buy Medical (BBM01) supplier portal automation.
 *
 * Today this targets the in-repo mock portal at
 * `/dev/mock-portals/bbm01/index.html`. To point at the real BBM01 portal,
 * set `SUPPLIER_PORTAL_BBM01_URL` to the live URL — the selectors here are
 * the ones the production runner will need to match.
 *
 * Selectors:
 *   - login: #username, #password, #login-btn
 *   - login error: [data-testid="login-error"]
 *   - search: #search-sku, #search-btn, #search-screen
 *   - result card: [data-testid="result-card"]
 *   - result fields: result-sku / result-name / result-price / result-stock
 *   - not found: [data-testid="not-found"]
 *
 * Per CLAUDE.md §14 we never store credentials in code or logs — they come
 * from the encrypted vault via `resolveCredentialsBundle`.
 */

import { withBrowserPage } from "@/server/automation/playwright-runner";

export type BbmCredentials = {
  username: string;
  password: string;
  /** Override portal URL. Falls back to env, then mock portal. */
  loginUrl?: string;
};

export type PortalLookup = {
  found: boolean;
  sku: string;
  name: string | null;
  price: number | null;
  stock: string | null;
  rawPrice: string | null;
};

export type RunResult = {
  lookup: PortalLookup;
  /** Screenshots captured along the way for the AutomationEvidence rows. */
  screenshots: { label: string; bytes: Buffer }[];
};

export class BbmAuthError extends Error {
  constructor() {
    super("BBM01 portal rejected the supplied credentials.");
    this.name = "BbmAuthError";
  }
}

const FALLBACK_MOCK_URL =
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/dev/mock-portals/bbm01/index.html`
    : "http://localhost:3000/dev/mock-portals/bbm01/index.html";

export function resolvePortalUrl(creds: BbmCredentials): string {
  return (
    creds.loginUrl ??
    process.env.SUPPLIER_PORTAL_BBM01_URL ??
    FALLBACK_MOCK_URL
  );
}

/**
 * Log in + look up a SKU. Returns the parsed lookup result + the screenshots
 * captured at each step. Throws BbmAuthError on a credential rejection.
 *
 * The same flow handles price-check + stock-check — they both need the
 * lookup; the caller decides which fields to record on the AutomationRun.
 */
export async function lookupSupplierSku(args: {
  sku: string;
  credentials: BbmCredentials;
}): Promise<RunResult> {
  const portalUrl = resolvePortalUrl(args.credentials);

  const { data, screenshots } = await withBrowserPage<PortalLookup>(async ({ page, capture }) => {
    await page.goto(portalUrl, { waitUntil: "domcontentloaded" });
    await capture("01-login-page");

    await page.fill("#username", args.credentials.username);
    await page.fill("#password", args.credentials.password);
    await page.click("#login-btn");

    // Either the search screen appears (success) or the login error shows.
    await Promise.race([
      page.waitForSelector('[data-testid="search-screen"]:not([hidden])', {
        timeout: 10_000,
      }),
      page.waitForSelector('[data-testid="login-error"]:not([hidden])', {
        timeout: 10_000,
      }),
    ]).catch(() => undefined);

    const loginErrorVisible = await page.isVisible('[data-testid="login-error"]:not([hidden])');
    if (loginErrorVisible) {
      await capture("02-login-rejected");
      throw new BbmAuthError();
    }
    await capture("02-after-login");

    await page.fill("#search-sku", args.sku);
    await page.click("#search-btn");

    await Promise.race([
      page.waitForSelector('[data-testid="result-card"]'),
      page.waitForSelector('[data-testid="not-found"]'),
    ]);
    await capture("03-search-result");

    const card = await page.$('[data-testid="result-card"]');
    if (!card) {
      return {
        found: false,
        sku: args.sku,
        name: null,
        price: null,
        stock: null,
        rawPrice: null,
      };
    }

    const name = (await page.textContent('[data-testid="result-name"]'))?.trim() ?? null;
    const rawPrice = (await page.textContent('[data-testid="result-price"]'))?.trim() ?? null;
    const stock = (await page.textContent('[data-testid="result-stock"]'))?.trim() ?? null;
    return {
      found: true,
      sku: args.sku,
      name,
      price: parsePrice(rawPrice),
      stock,
      rawPrice,
    };
  });

  return { lookup: data, screenshots };
}

/**
 * Pure parser for the portal price string. Exported for testing.
 *
 * Handles "$89.50", "89,50 $", "CAD 89.50", "1,234.56" and falls back to
 * null when the input doesn't contain a parseable amount.
 */
export function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/[A-Za-z$\s]/g, "")
    .replace(/,/g, ".")
    // collapse multiple decimal separators (the comma->dot above can leave
    // pairs like "1.234.56"); keep the last segment as the cents.
    .replace(/^(.*)\.(\d+)$/, (_, intPart: string, cents: string) => {
      const intDigits = intPart.replace(/\./g, "");
      return `${intDigits}.${cents}`;
    });
  // Reject empty / digit-free input — Number("") returns 0 which would
  // otherwise pass the isFinite check.
  if (cleaned === "" || !/\d/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
