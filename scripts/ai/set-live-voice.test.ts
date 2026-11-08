/**
 * Safety tests for the live-voice switch script. It is run against the
 * production database as a one-off job, so what has to be proved is the
 * shape of what it can touch: the pure argument handling, the production
 * guard, and that every write goes through the two audited service
 * functions the Admin pages themselves call.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { KILL_SWITCH_KEYS } from "@/server/services/feature-flags/kill-switch";

import { PRODUCTION_ACK, isProductionEnvironment, parseArgs, validateCap } from "./set-live-voice";

const source = readFileSync(join(__dirname, "set-live-voice.ts"), "utf8").replace(/\r\n/g, "\n");
const code = source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("parseArgs", () => {
  it("reads the switch, the caps, the actor and the acknowledgements", () => {
    expect(
      parseArgs([
        "--on",
        "--daily-usd",
        "50",
        "--daily-usd-per-user",
        "10",
        "--actor-email",
        "owner@example.com",
        "--apply",
        PRODUCTION_ACK,
      ]),
    ).toEqual({
      flag: true,
      dailyUsd: "50",
      dailyUsdPerUser: "10",
      actorEmail: "owner@example.com",
      apply: true,
      acknowledged: true,
    });
    expect(parseArgs(["--off", "--actor-email", "o@x.com"])).toMatchObject({
      flag: false,
      apply: false,
      acknowledged: false,
    });
  });

  it("refuses an empty request, a missing actor, a missing value and an unknown argument", () => {
    expect(parseArgs(["--actor-email", "o@x.com"])).toMatchObject({ error: /Nothing to do/ });
    expect(parseArgs(["--on"])).toMatchObject({ error: /--actor-email is required/ });
    expect(parseArgs(["--on", "--daily-usd", "--actor-email", "o@x.com"])).toMatchObject({
      error: /--daily-usd needs a value/,
    });
    expect(parseArgs(["--on", "--force", "--actor-email", "o@x.com"])).toMatchObject({
      error: /Unknown argument: --force/,
    });
  });
});

describe("validateCap", () => {
  it("applies the AI Settings page's rule: 0 or a positive number up to a million", () => {
    expect(validateCap("0")).toBeNull();
    expect(validateCap("50")).toBeNull();
    expect(validateCap("12.5")).toBeNull();
    expect(validateCap("-1")).toMatch(/Daily limits/);
    expect(validateCap("abc")).toMatch(/Daily limits/);
    expect(validateCap("1000001")).toMatch(/Daily limits/);
  });
});

describe("the production guard", () => {
  it("treats NODE_ENV, DEPLOY_ENV and Render's own marker as production", () => {
    expect(isProductionEnvironment({})).toBe(false);
    expect(isProductionEnvironment({ NODE_ENV: "development" })).toBe(false);
    expect(isProductionEnvironment({ NODE_ENV: "production" })).toBe(true);
    expect(isProductionEnvironment({ DEPLOY_ENV: "Production" })).toBe(true);
    expect(isProductionEnvironment({ RENDER: "true" })).toBe(true);
  });

  it("is a dry run unless --apply is given, and refuses production without the acknowledgement", () => {
    expect(code).toContain("if (!parsed.apply) {");
    expect(code).toContain("isProductionEnvironment(process.env) && !parsed.acknowledged");
  });
});

describe("the write surface is narrow", () => {
  it("writes only through setFeatureFlag and setSetting, never through Prisma directly", () => {
    const direct =
      code.match(
        /prisma\.[a-zA-Z]+\.(createMany|create|updateMany|update|upsert|deleteMany|delete|executeRaw)/g,
      ) ?? [];
    expect(direct).toEqual([]);
    expect(code).toContain(
      "setFeatureFlag(FEATURE_FLAGS.AI_LIVE_VOICE, parsed.flag, { id: actor.id })",
    );
    expect(code).toContain("setSetting(change.key, change.value, null, { id: actor.id })");
    // Only the live-voice flag and the two spend caps are reachable.
    expect(
      code.match(/FEATURE_FLAGS\.[A-Z_]+/g)?.every((m) => m === "FEATURE_FLAGS.AI_LIVE_VOICE"),
    ).toBe(true);
    expect(code).toContain('dailyUsd: "ai.budget.daily_usd"');
    expect(code).toContain('dailyUsdPerUser: "ai.budget.daily_usd_per_user"');
    expect(code).not.toMatch(/ai\.budget\.daily_voice|ai\.openai_|ai\.default_model/);
  });

  it("requires the actor to hold the permission the Admin pages require", () => {
    expect(code).toContain("PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS");
    expect(code).toContain('if (user.status !== "active")');
  });
});

describe("the kill switch", () => {
  it("turns live voice off with the other spend-bearing flags", () => {
    expect(KILL_SWITCH_KEYS).toContain(FEATURE_FLAGS.AI_LIVE_VOICE);
  });
});
