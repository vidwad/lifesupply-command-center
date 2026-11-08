/**
 * Turn the assistant's live voice on or off, and set the daily AI spend caps,
 * through the same audited service functions the Admin pages call.
 *
 * WHY THIS EXISTS. The two switches for live voice (docs/43 §11) are the
 * owner's: the `ai.live_voice` flag in Admin → Feature Flags and the daily
 * caps in Admin → AI Settings. Those pages need the owner's browser session.
 * When the owner instructs the change but is not at the keyboard, this
 * script applies it as a one-off Render job inside the web service's image,
 * where the database credential already is; it never has to leave Render.
 *
 * WRITE SURFACE — deliberately tiny, and asserted by canary:
 *   1. `setFeatureFlag(ai.live_voice, …)`, which upserts the flag row and
 *      writes the `feature_flag.enabled` / `feature_flag.disabled` audit row.
 *   2. `setSetting(ai.budget.daily_usd, …)` and
 *      `setSetting(ai.budget.daily_usd_per_user, …)`, which upsert the setting
 *      rows and write `system_setting.updated` audit rows.
 *
 * The actor is a named, active user who holds `admin.manage_system_settings`,
 * the permission the Admin pages require, so the audit log reads exactly as
 * if that person had clicked.
 *
 * SAFETY. Dry run is the default. Nothing is written without `--apply`, and
 * in a production environment (NODE_ENV=production, RENDER set, or
 * DEPLOY_ENV=production) `--apply` additionally requires
 * `--i-understand-this-writes-to-production`.
 *
 *   pnpm ai:live-voice --on --actor-email owner@example.com
 *       # dry run: prints the current and intended state, writes nothing
 *   pnpm ai:live-voice --on --daily-usd 50 --daily-usd-per-user 10 \
 *       --actor-email owner@example.com --apply --i-understand-this-writes-to-production
 *   pnpm ai:live-voice --off --actor-email owner@example.com --apply …
 */

// Relative imports (not `@/`) for the script's own imports — matches
// prisma/seed.ts and the other scripts; the services resolve their own.
import { FEATURE_FLAGS } from "../../src/lib/feature-flags";
import { PERMISSIONS } from "../../src/lib/permissions";
import { prisma } from "../../src/server/db/client";
import { isFeatureOn, setFeatureFlag } from "../../src/server/services/feature-flags";
import {
  getSettings,
  setSetting,
  type SettingKey,
} from "../../src/server/services/system-settings";

export const PRODUCTION_ACK = "--i-understand-this-writes-to-production";

export type Options = {
  /** true = turn on, false = turn off, null = leave the flag alone. */
  flag: boolean | null;
  /** Daily cap across everyone, USD, as typed; null = leave alone. */
  dailyUsd: string | null;
  /** Daily cap per person, USD, as typed; null = leave alone. */
  dailyUsdPerUser: string | null;
  actorEmail: string | null;
  apply: boolean;
  acknowledged: boolean;
};

/** Pure: the command line to options. Unknown arguments are an error. */
export function parseArgs(argv: string[]): Options | { error: string } {
  const options: Options = {
    flag: null,
    dailyUsd: null,
    dailyUsdPerUser: null,
    actorEmail: null,
    apply: false,
    acknowledged: false,
  };
  const valueOf = (index: number, name: string): string | { error: string } => {
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) return { error: `${name} needs a value.` };
    return value;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--on":
        options.flag = true;
        break;
      case "--off":
        options.flag = false;
        break;
      case "--apply":
        options.apply = true;
        break;
      case PRODUCTION_ACK:
        options.acknowledged = true;
        break;
      case "--daily-usd":
      case "--daily-usd-per-user":
      case "--actor-email": {
        const value = valueOf(i, arg);
        if (typeof value !== "string") return value;
        if (arg === "--daily-usd") options.dailyUsd = value;
        else if (arg === "--daily-usd-per-user") options.dailyUsdPerUser = value;
        else options.actorEmail = value;
        i += 1;
        break;
      }
      default:
        return { error: `Unknown argument: ${arg}` };
    }
  }
  if (options.flag === null && options.dailyUsd === null && options.dailyUsdPerUser === null) {
    return { error: "Nothing to do: pass --on, --off, --daily-usd or --daily-usd-per-user." };
  }
  if (!options.actorEmail)
    return { error: "--actor-email is required: the audit rows name the actor." };
  return options;
}

/** Pure: the same rule the AI Settings page applies to a daily cap. */
export function validateCap(value: string): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
    return "Daily limits must be 0 (no limit) or a positive number.";
  }
  return null;
}

/** Pure: whether this process is running against production. */
export function isProductionEnvironment(env: Record<string, string | undefined>): boolean {
  return (
    (env.NODE_ENV ?? "").toLowerCase() === "production" ||
    (env.DEPLOY_ENV ?? "").toLowerCase() === "production" ||
    Boolean(env.RENDER)
  );
}

const CAP_KEYS = {
  dailyUsd: "ai.budget.daily_usd",
  dailyUsdPerUser: "ai.budget.daily_usd_per_user",
} as const satisfies Record<string, SettingKey>;

async function resolveActor(email: string): Promise<{ id: string; name: string | null }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      status: true,
      userRoles: {
        select: {
          role: {
            select: { rolePermissions: { select: { permission: { select: { key: true } } } } },
          },
        },
      },
    },
  });
  if (!user) throw new Error(`No user with email ${email}.`);
  if (user.status !== "active") throw new Error(`User ${email} is ${user.status}, not active.`);
  const holds = user.userRoles.some((ur) =>
    ur.role.rolePermissions.some(
      (rp) => rp.permission.key === PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS,
    ),
  );
  if (!holds) {
    throw new Error(
      `User ${email} does not hold ${PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS}, which the Admin pages require.`,
    );
  }
  return { id: user.id, name: user.name };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if ("error" in parsed) {
    console.error(parsed.error);
    process.exitCode = 1;
    return;
  }
  for (const value of [parsed.dailyUsd, parsed.dailyUsdPerUser]) {
    const problem = value === null ? null : validateCap(value);
    if (problem) {
      console.error(problem);
      process.exitCode = 1;
      return;
    }
  }

  const actor = await resolveActor(parsed.actorEmail as string);
  const flagNow = await isFeatureOn(FEATURE_FLAGS.AI_LIVE_VOICE);
  const settingsNow = await getSettings([CAP_KEYS.dailyUsd, CAP_KEYS.dailyUsdPerUser]);

  const changes: string[] = [];
  if (parsed.flag !== null && parsed.flag !== flagNow) {
    changes.push(
      `${FEATURE_FLAGS.AI_LIVE_VOICE}: ${flagNow ? "on" : "off"} → ${parsed.flag ? "on" : "off"}`,
    );
  }
  const capChanges: { key: SettingKey; value: string }[] = [];
  for (const [field, key] of Object.entries(CAP_KEYS) as [keyof typeof CAP_KEYS, SettingKey][]) {
    const wanted = parsed[field];
    if (wanted !== null && wanted !== settingsNow[key]) {
      capChanges.push({ key, value: wanted });
      changes.push(`${key}: ${settingsNow[key]} → ${wanted}`);
    }
  }

  console.log(`Actor: ${actor.name ?? parsed.actorEmail} (${actor.id})`);
  console.log(
    `Now: ${FEATURE_FLAGS.AI_LIVE_VOICE}=${flagNow ? "on" : "off"}, ${CAP_KEYS.dailyUsd}=${settingsNow[CAP_KEYS.dailyUsd]}, ${CAP_KEYS.dailyUsdPerUser}=${settingsNow[CAP_KEYS.dailyUsdPerUser]}`,
  );
  if (changes.length === 0) {
    console.log("Nothing to change: the requested state is already in place.");
    return;
  }
  console.log("Changes:");
  for (const change of changes) console.log(`  ${change}`);

  if (!parsed.apply) {
    console.log("DRY RUN: nothing written. Re-run with --apply to write.");
    return;
  }
  if (isProductionEnvironment(process.env) && !parsed.acknowledged) {
    console.error(
      `REFUSED: this is a production environment. Re-run with --apply ${PRODUCTION_ACK} if that is genuinely intended.`,
    );
    process.exitCode = 1;
    return;
  }

  if (parsed.flag !== null && parsed.flag !== flagNow) {
    await setFeatureFlag(FEATURE_FLAGS.AI_LIVE_VOICE, parsed.flag, { id: actor.id });
  }
  for (const change of capChanges) {
    await setSetting(change.key, change.value, null, { id: actor.id });
  }

  const flagAfter = await isFeatureOn(FEATURE_FLAGS.AI_LIVE_VOICE);
  const settingsAfter = await getSettings([CAP_KEYS.dailyUsd, CAP_KEYS.dailyUsdPerUser]);
  console.log(
    `Applied. After: ${FEATURE_FLAGS.AI_LIVE_VOICE}=${flagAfter ? "on" : "off"}, ${CAP_KEYS.dailyUsd}=${settingsAfter[CAP_KEYS.dailyUsd]}, ${CAP_KEYS.dailyUsdPerUser}=${settingsAfter[CAP_KEYS.dailyUsdPerUser]}`,
  );
}

// Only run when executed directly, so the test can import the pure helpers.
if (process.argv[1] && /set-live-voice\.ts$/.test(process.argv[1].replace(/\\/g, "/"))) {
  main()
    .catch((err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
