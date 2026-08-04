/**
 * Best Buy Medical (BBM01) supplier portal automation.
 *
 * Today this targets the in-repo mock portal at
 * `/dev/mock-portals/bbm01/index.html`. To point at the real BBM01 portal,
 * set `SUPPLIER_PORTAL_BBM01_URL` (or the connection's loginUrl field) to
 * the live URL — `BBM01_SELECTORS` below is the single source of truth for
 * every selector the runner touches, so validating against the real portal
 * means checking that map, not hunting through the flow.
 *
 * Selector validation (Phase 7, docs/19 §7 #1): every wait is wrapped so a
 * missing selector fails with a `SelectorNotFoundError` naming the selector
 * key + CSS — reviewers see exactly which part of the page changed — and a
 * screenshot is captured before the error propagates. See
 * docs/OPS_RUNBOOK.md §5.5 for the validation procedure.
 *
 * Per CLAUDE.md §14 we never store credentials in code or logs — they come
 * from the encrypted vault via `resolveCredentialsBundle`.
 */

import { withBrowserPage } from "@/server/automation/playwright-runner";

/**
 * Single source of truth for BBM01 portal selectors. When the real portal
 * differs from the mock, update the values here (the keys are stable) and
 * re-run a sku_check to validate.
 */
export const BBM01_SELECTORS = {
  username: "#username",
  password: "#password",
  loginButton: "#login-btn",
  loginError: '[data-testid="login-error"]:not([hidden])',
  searchScreen: '[data-testid="search-screen"]:not([hidden])',
  searchInput: "#search-sku",
  searchButton: "#search-btn",
  resultCard: '[data-testid="result-card"]',
  resultName: '[data-testid="result-name"]',
  resultPrice: '[data-testid="result-price"]',
  resultStock: '[data-testid="result-stock"]',
  notFound: '[data-testid="not-found"]',
} as const;

export type Bbm01SelectorKey = keyof typeof BBM01_SELECTORS;

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

/**
 * A selector the automation depends on did not appear — the portal layout
 * has likely changed (docs/10 §10 `portal_layout_changed`). The message
 * names the selector key + CSS so operators can fix `BBM01_SELECTORS`
 * without reading a stack trace.
 */
export class SelectorNotFoundError extends Error {
  readonly selectorKey: string;
  readonly selector: string;
  constructor(selectorKey: Bbm01SelectorKey, selector: string, stage: string) {
    super(
      `Portal selector "${selectorKey}" (${selector}) did not appear during ${stage}. ` +
        `The portal layout may have changed — validate BBM01_SELECTORS against the live page.`,
    );
    this.name = "SelectorNotFoundError";
    this.selectorKey = selectorKey;
    this.selector = selector;
  }
}

const FALLBACK_MOCK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/dev/mock-portals/bbm01/index.html`
  : "http://localhost:3000/dev/mock-portals/bbm01/index.html";

export function resolvePortalUrl(creds: BbmCredentials): string {
  return creds.loginUrl ?? process.env.SUPPLIER_PORTAL_BBM01_URL ?? FALLBACK_MOCK_URL;
}

/** True when the runner is pointed at the in-repo mock, not a live portal. */
export function isMockPortalUrl(url: string): boolean {
  return url.includes("/dev/mock-portals/");
}

/**
 * Log in + look up a SKU. Returns the parsed lookup result + the screenshots
 * captured at each step. Throws BbmAuthError on a credential rejection and
 * SelectorNotFoundError when an expected page element never appears.
 *
 * The same flow serves price_check, stock_check, and sku_check — they all
 * need the lookup; the caller decides which fields to compare and record.
 */
export async function lookupSupplierSku(args: {
  sku: string;
  credentials: BbmCredentials;
}): Promise<RunResult> {
  const portalUrl = resolvePortalUrl(args.credentials);
  const S = BBM01_SELECTORS;

  const { data, screenshots } = await withBrowserPage<PortalLookup>(async ({ page, capture }) => {
    await page.goto(portalUrl, { waitUntil: "domcontentloaded" });
    await capture("01-login-page");

    // Fail with a named selector error if the login form itself is missing —
    // the most common symptom of a changed portal or a wrong URL.
    for (const key of ["username", "password", "loginButton"] as const) {
      if (!(await page.$(S[key]))) {
        await capture("01-login-form-missing");
        throw new SelectorNotFoundError(key, S[key], "login form load");
      }
    }

    await page.fill(S.username, args.credentials.username);
    await page.fill(S.password, args.credentials.password);
    await page.click(S.loginButton);

    // Either the search screen appears (success) or the login error shows.
    await Promise.race([
      page.waitForSelector(S.searchScreen, { timeout: 10_000 }),
      page.waitForSelector(S.loginError, { timeout: 10_000 }),
    ]).catch(() => undefined);

    if (await page.isVisible(S.loginError)) {
      await capture("02-login-rejected");
      throw new BbmAuthError();
    }
    if (!(await page.isVisible(S.searchScreen))) {
      await capture("02-post-login-unrecognized");
      throw new SelectorNotFoundError("searchScreen", S.searchScreen, "post-login");
    }
    await capture("02-after-login");

    if (!(await page.$(S.searchInput)) || !(await page.$(S.searchButton))) {
      await capture("02-search-form-missing");
      throw new SelectorNotFoundError("searchInput", S.searchInput, "search form load");
    }
    await page.fill(S.searchInput, args.sku);
    await page.click(S.searchButton);

    const settled = await Promise.race([
      page.waitForSelector(S.resultCard).then(() => "result" as const),
      page.waitForSelector(S.notFound).then(() => "not_found" as const),
    ]).catch(() => null);
    if (settled === null) {
      await capture("03-search-outcome-missing");
      throw new SelectorNotFoundError("resultCard", S.resultCard, "search results");
    }
    await capture("03-search-result");

    if (settled === "not_found") {
      return {
        found: false,
        sku: args.sku,
        name: null,
        price: null,
        stock: null,
        rawPrice: null,
      };
    }

    const name = (await page.textContent(S.resultName))?.trim() ?? null;
    const rawPrice = (await page.textContent(S.resultPrice))?.trim() ?? null;
    const stock = (await page.textContent(S.resultStock))?.trim() ?? null;
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
