import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  fetchCompetitorPage,
  isAllowedByRobots,
  isPublicHttpUrl,
  resetRobotsCache,
} from "./collector";

const realFetch = globalThis.fetch;

describe("isPublicHttpUrl", () => {
  it("accepts public http and https URLs", () => {
    expect(isPublicHttpUrl("https://competitor.example/p/1")).toBe(true);
    expect(isPublicHttpUrl("http://competitor.example/p/1")).toBe(true);
  });

  it("refuses non-http schemes", () => {
    for (const url of ["file:///etc/passwd", "ftp://x.example/f", "javascript:alert(1)"]) {
      expect(isPublicHttpUrl(url), url).toBe(false);
    }
  });

  it("refuses hosts that could reach internal infrastructure", () => {
    // A competitor URL is by definition on the public internet; anything else
    // is a request the operator did not intend to make.
    for (const url of [
      "http://localhost:3000/x",
      "http://app.localhost/x",
      "http://10.0.0.5/x",
      "http://127.0.0.1/x",
      "http://db.internal/x",
      "http://printer.local/x",
    ]) {
      expect(isPublicHttpUrl(url), url).toBe(false);
    }
  });

  it("refuses malformed input", () => {
    expect(isPublicHttpUrl("not a url")).toBe(false);
    expect(isPublicHttpUrl("")).toBe(false);
  });
});

describe("isAllowedByRobots", () => {
  it("allows when nothing disallows the path", () => {
    expect(isAllowedByRobots("User-agent: *\nDisallow: /admin", "/product/1")).toBe(true);
  });

  it("obeys a disallow that covers the path", () => {
    expect(isAllowedByRobots("User-agent: *\nDisallow: /product", "/product/1")).toBe(false);
  });

  it("lets a more specific allow override a broader disallow", () => {
    const robots = "User-agent: *\nDisallow: /\nAllow: /product";
    expect(isAllowedByRobots(robots, "/product/1")).toBe(true);
    expect(isAllowedByRobots(robots, "/admin")).toBe(false);
  });

  it("applies rules for our named agent", () => {
    const robots = "User-agent: LifeSupplyCommandCenter-PriceCheck\nDisallow: /product";
    expect(isAllowedByRobots(robots, "/product/1")).toBe(false);
  });

  it("ignores rules aimed at a different agent", () => {
    const robots = "User-agent: SomeOtherBot\nDisallow: /product";
    expect(isAllowedByRobots(robots, "/product/1")).toBe(true);
  });

  it("ignores comments and blank lines", () => {
    const robots = "# comment\n\nUser-agent: *\n# another\nDisallow: /product # trailing";
    expect(isAllowedByRobots(robots, "/product/1")).toBe(false);
  });

  it("treats an empty robots file as permitting", () => {
    // An unreachable or empty robots file is not a prohibition; any rule we DO
    // understand is obeyed, and terms review remains a separate gate.
    expect(isAllowedByRobots("", "/product/1")).toBe(true);
  });
});
// ---------------------------------------------------------------------------
// Behavioural tests (DP-3A §4 and §5)
//
// The canaries in pricing.test.ts assert the guard code EXISTS. These assert it
// WORKS, which is what the corrections actually asked for: a canary can pass
// while the logic around it is wrong.
// ---------------------------------------------------------------------------

type FetchCall = { url: string; init?: RequestInit };

function installFetch(handler: (url: string, init?: RequestInit) => Response): FetchCall[] {
  const calls: FetchCall[] = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, init });
    return Promise.resolve(handler(url, init));
  }) as typeof fetch;
  return calls;
}

const html = (body: string) =>
  new Response(body, { status: 200, headers: { "content-type": "text/html" } });

describe("fetchCompetitorPage — response size cap", () => {
  beforeEach(() => resetRobotsCache());
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("refuses an oversized response BEFORE reading the body", async () => {
    let bodyRead = false;
    const calls = installFetch((url) => {
      if (url.endsWith("/robots.txt")) return new Response("", { status: 404 });
      const response = new Response("small", {
        status: 200,
        headers: { "content-type": "text/html", "content-length": "999999999" },
      });
      Object.defineProperty(response, "body", {
        get() {
          bodyRead = true;
          return null;
        },
      });
      return response;
    });

    const result = await fetchCompetitorPage("https://competitor.example/p/1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/larger than/i);
    // The point of a pre-read refusal: the page never enters memory.
    expect(bodyRead).toBe(false);
    expect(calls.some((c) => c.url.includes("/p/1"))).toBe(true);
  });

  it("stops reading and refuses when a streamed body passes the cap", async () => {
    let cancelled = false;
    installFetch((url) => {
      if (url.endsWith("/robots.txt")) return new Response("", { status: 404 });
      const chunk = new TextEncoder().encode("x".repeat(100_000));
      let sent = 0;
      const stream = new ReadableStream<Uint8Array>({
        pull(controller) {
          sent += 1;
          // 30 x 100KB = 3MB, comfortably past the 2MB cap.
          if (sent > 30) controller.close();
          else controller.enqueue(chunk);
        },
        cancel() {
          cancelled = true;
        },
      });
      return new Response(stream, { status: 200, headers: { "content-type": "text/html" } });
    });

    const result = await fetchCompetitorPage("https://competitor.example/p/2");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/cap while reading/i);
    expect(cancelled).toBe(true);
  });

  it("returns a normal page under the cap", async () => {
    installFetch((url) =>
      url.endsWith("/robots.txt") ? new Response("", { status: 404 }) : html("<html>ok</html>"),
    );
    const result = await fetchCompetitorPage("https://competitor.example/p/3");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.html).toContain("ok");
  });
});

describe("fetchCompetitorPage — robots redirects", () => {
  beforeEach(() => resetRobotsCache());
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("never consults a cross-origin robots file, so it cannot authorize a check", async () => {
    const calls = installFetch((url) => {
      if (url === "https://competitor.example/robots.txt") {
        return new Response(null, {
          status: 301,
          headers: { location: "https://cdn.other-site.example/robots.txt" },
        });
      }
      if (url.includes("other-site")) {
        // If this were ever read, a foreign site's rules would be governing us.
        return new Response("User-agent: *\nAllow: /", { status: 200 });
      }
      return html("<html>page</html>");
    });

    await fetchCompetitorPage("https://competitor.example/p/1");
    expect(calls.some((c) => c.url.includes("other-site"))).toBe(false);
  });

  it("follows a same-origin robots redirect and obeys what it finds", async () => {
    installFetch((url) => {
      if (url === "https://competitor.example/robots.txt") {
        return new Response(null, {
          status: 302,
          headers: { location: "https://competitor.example/robots-real.txt" },
        });
      }
      if (url === "https://competitor.example/robots-real.txt") {
        return new Response("User-agent: *\nDisallow: /p", { status: 200 });
      }
      return html("<html>page</html>");
    });

    const result = await fetchCompetitorPage("https://competitor.example/p/1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/robots/i);
  });

  it("requests robots.txt without credentials", async () => {
    const calls = installFetch((url) =>
      url.endsWith("/robots.txt") ? new Response("", { status: 404 }) : html("<html>ok</html>"),
    );
    await fetchCompetitorPage("https://competitor.example/p/1");
    for (const call of calls) {
      expect(call.init?.credentials).toBe("omit");
      expect(call.init?.method).toBe("GET");
    }
  });
});
