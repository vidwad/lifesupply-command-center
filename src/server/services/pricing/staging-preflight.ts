/**
 * Pricing Intelligence staging preflight — read-only readiness check.
 *
 * Answers "is this environment ready for the certification exercise in
 * docs/29?" without changing anything. It reads feature flags, role grants,
 * and store↔connection mappings from the local database and reports what an
 * operator must fix before starting.
 *
 * It contacts BigCommerce not at all. Confirming that the store actually
 * responds is step A of the workbook and is done by the reconcile action,
 * which is explicitly triggered — a readiness page must not reach outside the
 * building on render.
 *
 * Everything here is a SELECT. This module imports no writeback, rollback, or
 * BigCommerce client, and a canary enforces that.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/server/db/client";

/** Severity of a failed check, for how the operator should react. */
export type CheckLevel = "blocker" | "warning" | "info";

export type PreflightCheck = {
  id: string;
  label: string;
  ok: boolean;
  level: CheckLevel;
  detail: string;
};

/**
 * Flags that MUST be off before the exercise begins.
 *
 * The workbook enables them deliberately, mid-exercise, in staging only. A
 * preflight that found them already on would mean somebody enabled a live
 * price-writing capability outside the procedure, which is a blocker rather
 * than a convenience.
 */
export const MUST_BE_OFF_AT_PREFLIGHT = [
  FEATURE_FLAGS.PRICING_WRITEBACKS,
  FEATURE_FLAGS.EXTERNAL_WRITEBACKS,
] as const;

/** Permissions the exercise needs somebody to hold. */
export const EXERCISE_PERMISSIONS = [
  PERMISSIONS.PRICING_VIEW,
  PERMISSIONS.PRICING_MANAGE_RULES,
  PERMISSIONS.PRICING_MANAGE_COMPETITORS,
  PERMISSIONS.PRICING_CREATE_RUNS,
  PERMISSIONS.PRICING_RUN_CHECKS,
  PERMISSIONS.PRICING_REVIEW_RECOMMENDATIONS,
  PERMISSIONS.PRICING_APPROVE_RECOMMENDATIONS,
  PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE,
  PERMISSIONS.PRICING_EXPORT,
] as const;

const check = (
  id: string,
  label: string,
  ok: boolean,
  level: CheckLevel,
  detail: string,
): PreflightCheck => ({ id, label, ok, level, detail });

/**
 * Runs every readiness check.
 *
 * Never throws on a failed check — a preflight that crashes tells the operator
 * less than one that reports ten results with two failures.
 */
export async function runStagingPreflight(): Promise<{
  checks: PreflightCheck[];
  blockers: number;
  ready: boolean;
}> {
  const checks: PreflightCheck[] = [];

  // ---- Feature-flag posture ----------------------------------------------
  const flagRows = await prisma.featureFlag.findMany({
    where: { key: { in: [FEATURE_FLAGS.PRICING_INTELLIGENCE, ...MUST_BE_OFF_AT_PREFLIGHT] } },
    select: { key: true, enabled: true },
  });
  const flagState = new Map(flagRows.map((row) => [row.key, row.enabled]));
  // An absent row resolves to false everywhere in this codebase.
  const isOn = (key: string): boolean => flagState.get(key) ?? false;

  checks.push(
    check(
      "FLAG-01",
      "pricing.intelligence is ON",
      isOn(FEATURE_FLAGS.PRICING_INTELLIGENCE),
      "blocker",
      isOn(FEATURE_FLAGS.PRICING_INTELLIGENCE)
        ? "Enabled. Runs, checks, recommendations, and approvals can proceed."
        : "Off. Building runs, checking competitors, generating recommendations, and approving all refuse until this is on. Enable it in /admin/feature-flags before step B.",
    ),
  );

  for (const flag of MUST_BE_OFF_AT_PREFLIGHT) {
    const on = isOn(flag);
    checks.push(
      check(
        "FLAG-" + flag,
        flag + " is OFF at preflight",
        !on,
        "blocker",
        on
          ? "ON. Something enabled a live price-writing capability outside the procedure. Find out what before continuing — the workbook turns these on deliberately at step G, not before."
          : "Off, as required. Step G turns it on in staging only, and step K turns it back off.",
      ),
    );
  }

  // ---- Do the permissions even exist in this database? -------------------
  // Distinct from "no role grants it". A permission absent from the table
  // means the database predates the feature and needs the seed re-run; a
  // permission present but ungranted needs a role amended. Sending an operator
  // to edit a role that cannot reference a missing permission wastes the fix.
  const presentPermissions = await prisma.permission.findMany({
    where: { key: { in: [...EXERCISE_PERMISSIONS] } },
    select: { key: true },
  });
  const presentKeys = new Set(presentPermissions.map((row) => row.key));
  const absentKeys = EXERCISE_PERMISSIONS.filter((key) => !presentKeys.has(key));
  checks.push(
    check(
      "PERM-00",
      "Pricing permissions exist in this database",
      absentKeys.length === 0,
      "blocker",
      absentKeys.length === 0
        ? "All " + EXERCISE_PERMISSIONS.length + " pricing permissions are present."
        : absentKeys.length +
            " pricing permission(s) are missing from the database entirely: " +
            absentKeys.join(", ") +
            ". This database predates Pricing Intelligence. Re-run the seed (`pnpm db:seed`) so the permission rows exist — amending a role cannot grant a permission that is not there.",
    ),
  );

  // ---- Who can actually run the exercise ---------------------------------
  const roles = await prisma.role.findMany({
    select: {
      name: true,
      rolePermissions: { select: { permission: { select: { key: true } } } },
    },
  });
  const holders = (permission: string): string[] =>
    roles
      .filter((role) => role.rolePermissions.some((rp) => rp.permission.key === permission))
      .map((role) => role.name);

  for (const permission of EXERCISE_PERMISSIONS) {
    const withPermission = holders(permission);
    checks.push(
      check(
        "PERM-" + permission,
        "A role grants " + permission,
        withPermission.length > 0,
        permission === PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE ? "blocker" : "warning",
        withPermission.length > 0
          ? "Held by: " + withPermission.join(", ") + "."
          : presentKeys.has(permission)
            ? "The permission exists but no role grants it. Amend a role before the steps that need it."
            : "Not present in this database at all — see PERM-00. Re-seed first.",
      ),
    );
  }

  // Separation of duties is worth stating rather than assuming: if one role
  // both approves and writes back, the DP-5/DP-6 permission split buys nothing
  // in practice.
  const approvers = holders(PERMISSIONS.PRICING_APPROVE_RECOMMENDATIONS);
  const writers = holders(PERMISSIONS.PRICING_WRITEBACK_BIGCOMMERCE);
  const bothRoles = approvers.filter((name) => writers.includes(name));
  checks.push(
    check(
      "PERM-SEPARATION",
      "Approval and writeback are separable",
      bothRoles.length < approvers.length || approvers.length === 0,
      "info",
      bothRoles.length === 0
        ? "No role holds both approve and writeback. Two people are required end to end."
        : "Roles holding BOTH approve and writeback: " +
            bothRoles.join(", ") +
            ". One person could approve and publish. Acceptable for a staging exercise; decide before production.",
    ),
  );

  // ---- Store routing ------------------------------------------------------
  const stores = await prisma.store.findMany({
    where: { platform: "bigcommerce" },
    select: {
      id: true,
      name: true,
      integrationConnections: {
        where: { integrationType: "bigcommerce" },
        select: { id: true, name: true },
      },
    },
  });
  checks.push(
    check(
      "STORE-01",
      "At least one BigCommerce store exists",
      stores.length > 0,
      "blocker",
      stores.length > 0
        ? stores.length + " store(s): " + stores.map((s) => s.name).join(", ") + "."
        : "No store with platform 'bigcommerce'. The exercise has no target.",
    ),
  );

  // DP-6 refuses zero or multiple linked connections, so a store with either
  // cannot be written to. Reporting it here saves discovering it at step G.
  const badlyMapped = stores.filter((s) => s.integrationConnections.length !== 1);
  checks.push(
    check(
      "STORE-02",
      "Each BigCommerce store has exactly one linked connection",
      stores.length > 0 && badlyMapped.length === 0,
      "blocker",
      badlyMapped.length === 0
        ? "Every store routes to exactly one connection."
        : "Ambiguous or missing routing: " +
            badlyMapped.map((s) => s.name + " has " + s.integrationConnections.length).join("; ") +
            ". Writeback refuses on both, by design — fix IntegrationConnection.storeId.",
    ),
  );

  // ---- Test data ----------------------------------------------------------
  const mappedVariants = await prisma.productVariant.count({
    where: { sourceSystem: "bigcommerce", sourceId: { not: null }, costPrice: { not: null } },
  });
  checks.push(
    check(
      "DATA-01",
      "A costed, BigCommerce-mapped variant exists",
      mappedVariants > 0,
      "blocker",
      mappedVariants > 0
        ? mappedVariants + " variant(s) carry a BigCommerce source id and a cost price."
        : "None found. A run item needs a cost to get a floor, and a source id to be writable. Run a BigCommerce product sync first.",
    ),
  );

  const rules = await prisma.pricingRule.count({ where: { enabled: true } });
  checks.push(
    check(
      "DATA-02",
      "An enabled pricing rule exists",
      rules > 0,
      "blocker",
      rules > 0
        ? rules + " enabled rule(s)."
        : "No enabled pricing rule. Building a list refuses without one.",
    ),
  );

  const allowedCompetitors = await prisma.pricingCompetitor.count({
    where: { enabled: true, termsReviewStatus: "reviewed_allowed" },
  });
  checks.push(
    check(
      "DATA-03",
      "A competitor is enabled and terms-reviewed",
      allowedCompetitors > 0,
      "warning",
      allowedCompetitors > 0
        ? allowedCompetitors + " competitor(s) at reviewed_allowed."
        : "None at reviewed_allowed. Step D (observation) will find nothing to check; steps E onward can still run on an uploaded competitor URL.",
    ),
  );

  const blockers = checks.filter((c) => !c.ok && c.level === "blocker").length;
  return { checks, blockers, ready: blockers === 0 };
}
