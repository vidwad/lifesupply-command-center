import { afterEach, describe, expect, it } from "vitest";

import { getCommandCenterLoginUrl } from "@/lib/public-site/command-center";

const originalCommandCenterUrl = process.env.NEXT_PUBLIC_COMMAND_CENTER_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_COMMAND_CENTER_URL = originalCommandCenterUrl;
});

describe("Command Center public-login destination", () => {
  it("uses the configured Render host and a same-origin dashboard return path", () => {
    process.env.NEXT_PUBLIC_COMMAND_CENTER_URL = "https://command.example.com/";
    expect(getCommandCenterLoginUrl()).toBe(
      "https://command.example.com/login?redirectTo=%2Fdashboard",
    );
  });

  it("uses the documented Render service fallback when no public value is configured", () => {
    delete process.env.NEXT_PUBLIC_COMMAND_CENTER_URL;
    expect(getCommandCenterLoginUrl()).toBe(
      "https://lifesupply-cc-web.onrender.com/login?redirectTo=%2Fdashboard",
    );
  });
});
