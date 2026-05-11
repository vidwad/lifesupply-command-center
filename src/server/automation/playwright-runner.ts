/**
 * Playwright runner abstraction. Loads playwright lazily so the rest of the
 * app doesn't pay the dep cost on every cold start.
 *
 * Per CLAUDE.md §14:
 * - Always headless in production.
 * - Always closes the browser even on error.
 * - Workflows receive a Page they can use; capturing screenshots / parsing
 *   results is the workflow's responsibility.
 *
 * Browser binaries are NOT shipped — run `pnpm exec playwright install
 * chromium` once on the host before triggering live runs. The runner
 * surfaces a clear error if the binary is missing instead of crashing.
 */

import type { Browser, BrowserContext, Page, chromium as ChromiumNs } from "playwright";

export class PlaywrightUnavailableError extends Error {
  constructor(detail: string) {
    super(
      `Playwright cannot launch a browser: ${detail}. Run \`pnpm exec playwright install chromium\` on this host.`,
    );
    this.name = "PlaywrightUnavailableError";
  }
}

export type RunOptions = {
  /** Headless in production; can be overridden for local debugging. */
  headless?: boolean;
  /** Per-page default timeout in ms. Defaults to 15s. */
  defaultTimeoutMs?: number;
  /** User agent to send. Optional. */
  userAgent?: string;
};

export type WorkflowResult<T> = {
  /** Workflow output. */
  data: T;
  /** Optional screenshot bytes captured by the workflow. */
  screenshots: { label: string; bytes: Buffer }[];
};

export type WorkflowContext = {
  page: Page;
  context: BrowserContext;
  /** Workflow helper to capture a screenshot under a stable label. */
  capture: (label: string) => Promise<void>;
};

export async function withBrowserPage<T>(
  workflow: (ctx: WorkflowContext) => Promise<T>,
  options: RunOptions = {},
): Promise<WorkflowResult<T>> {
  let chromium: typeof ChromiumNs;
  try {
    ({ chromium } = await import("playwright"));
  } catch (err) {
    throw new PlaywrightUnavailableError(
      err instanceof Error ? err.message : "import failed",
    );
  }

  let browser: Browser;
  try {
    browser = await chromium.launch({ headless: options.headless ?? true });
  } catch (err) {
    throw new PlaywrightUnavailableError(
      err instanceof Error ? err.message : "launch failed",
    );
  }

  const screenshots: { label: string; bytes: Buffer }[] = [];
  try {
    const context = await browser.newContext({ userAgent: options.userAgent });
    const page = await context.newPage();
    page.setDefaultTimeout(options.defaultTimeoutMs ?? 15_000);

    const data = await workflow({
      page,
      context,
      capture: async (label) => {
        const bytes = await page.screenshot({ type: "png", fullPage: true });
        screenshots.push({ label, bytes });
      },
    });
    return { data, screenshots };
  } finally {
    // Always close — even on error — so a runaway workflow doesn't leak
    // chromium processes on the worker host.
    await browser.close().catch(() => {
      /* swallow secondary close error */
    });
  }
}
