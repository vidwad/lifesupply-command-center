import { afterEach, describe, expect, it } from "vitest";

import { isLifeSupplyPublicHost } from "@/lib/public-site/host";

const originalMode = process.env.PUBLIC_SITE_MODE;
const originalHosts = process.env.PUBLIC_SITE_HOSTS;

afterEach(() => {
  process.env.PUBLIC_SITE_MODE = originalMode;
  process.env.PUBLIC_SITE_HOSTS = originalHosts;
});

describe("LifeSupply public host detection", () => {
  it("recognizes only configured public hosts by default", () => {
    process.env.PUBLIC_SITE_MODE = "false";
    process.env.PUBLIC_SITE_HOSTS = "lifesupplyhealth.com,www.lifesupplyhealth.com";
    expect(isLifeSupplyPublicHost("lifesupplyhealth.com")).toBe(true);
    expect(isLifeSupplyPublicHost("www.lifesupplyhealth.com:443")).toBe(true);
    expect(isLifeSupplyPublicHost("command.lifesupplyhealth.com")).toBe(false);
  });

  it("permits an explicit local public-preview mode", () => {
    process.env.PUBLIC_SITE_MODE = "true";
    expect(isLifeSupplyPublicHost("localhost:3000")).toBe(true);
  });
});
