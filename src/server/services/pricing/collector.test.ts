import { describe, expect, it } from "vitest";

import { isAllowedByRobots, isPublicHttpUrl } from "./collector";

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
