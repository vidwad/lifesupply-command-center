import { beforeEach, describe, expect, it, vi } from "vitest";

const info = vi.hoisted(() => vi.fn());
vi.mock("@/server/logger", () => ({ logger: { info } }));

import { recordServerEvent } from "./events";

beforeEach(() => info.mockReset());

describe("server-confirmed measurement events", () => {
  it("records the inquiry event with allowlisted identifiers only", () => {
    recordServerEvent("inquiry_submitted", {
      intent: "general",
      brand: "corporate",
      email: "visitor@example.com",
      path: "/contact/?x=1",
    });
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]![0]).toEqual({
      measurement: "inquiry_submitted",
      intent: "general",
      brand: "corporate",
    });
    expect(JSON.stringify(info.mock.calls[0])).not.toContain("visitor@example.com");
  });

  it("ignores browser-only events on the server and values that are not identifiers", () => {
    recordServerEvent("brand_destination_click", { brand: "wellmart" });
    expect(info).not.toHaveBeenCalled();
    recordServerEvent("inquiry_submitted", { intent: "general; drop table", brand: "corporate" });
    expect(info.mock.calls[0]![0]).toEqual({
      measurement: "inquiry_submitted",
      brand: "corporate",
    });
  });
});
