/**
 * The guard in front of the assistant's database tool (2026-11-04). Pure.
 *
 * The owner wants the assistant to answer from the whole database, and a
 * curated tool per question cannot keep up with that. So the owner's
 * account may hand the model a SELECT, and this decides what reaches
 * Postgres: one SELECT or WITH statement, no data-changing or
 * administrative keyword, no table that holds credentials or password
 * hashes, and always a row cap. The query then runs inside a read-only
 * transaction with a statement timeout (see tools.ts), so this guard is
 * the second line, not the only one.
 */

/** Tables the model never reads: password hashes, encrypted credentials, migration state. */
export const BLOCKED_TABLES = [
  "users",
  "integration_connections",
  "accounts",
  "sessions",
  "verification_tokens",
  "_prisma_migrations",
] as const;

export const MAX_ROWS = 200;

const FORBIDDEN =
  /\b(insert|update|delete|merge|drop|alter|create|truncate|grant|revoke|copy|vacuum|analyze|analyse|cluster|reindex|lock|call|do|set|reset|listen|notify|unlisten|refresh|discard|prepare|execute|deallocate|declare|fetch|move|close|begin|commit|rollback|savepoint|release|security|pg_sleep|pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file|lo_import|lo_export|dblink|current_setting|set_config)\b/i;

/** The statement with its string literals and comments blanked, for keyword checks. */
function skeleton(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/\$[a-zA-Z_]*\$[\s\S]*?\$[a-zA-Z_]*\$/g, "''");
}

export type SqlGuardResult = { ok: true; sql: string } | { ok: false; reason: string };

/**
 * Returns the statement to run, wrapped in a row cap, or the reason it is
 * refused. The wrapper subselect keeps the model's own ORDER BY and LIMIT
 * and still caps the rows.
 */
export function guardReadOnlySql(input: string): SqlGuardResult {
  const sql = input.trim().replace(/;\s*$/, "");
  if (!sql) return { ok: false, reason: "The query is empty." };
  const body = skeleton(sql);
  if (body.includes(";")) {
    return { ok: false, reason: "One statement only: the query contains a semicolon." };
  }
  if (!/^\s*(select|with)\b/i.test(body)) {
    return { ok: false, reason: "Only a SELECT (or WITH … SELECT) statement may run." };
  }
  const forbidden = body.match(FORBIDDEN);
  if (forbidden) {
    return { ok: false, reason: `The query uses "${forbidden[0]}", which is not allowed.` };
  }
  for (const table of BLOCKED_TABLES) {
    if (new RegExp(`(^|[^a-z0-9_])"?${table}"?([^a-z0-9_]|$)`, "i").test(body)) {
      return { ok: false, reason: `The "${table}" table is not readable by the assistant.` };
    }
  }
  if (/\binto\b/i.test(body)) {
    return { ok: false, reason: "SELECT INTO is not allowed." };
  }
  return { ok: true, sql: `SELECT * FROM (${sql}) AS assistant_query LIMIT ${MAX_ROWS}` };
}

/**
 * Makes query results JSON-safe: Postgres counts arrive as bigint, money
 * as Decimal objects, timestamps as Date. Nested one level, which is what
 * a row is.
 */
export function toJsonSafe(value: unknown): unknown {
  if (typeof value === "bigint")
    return Number.isSafeInteger(Number(value)) ? Number(value) : value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") {
    const maybeDecimal = value as { toFixed?: unknown; toString?: () => string; d?: unknown };
    if (typeof maybeDecimal.toFixed === "function" && "d" in value) {
      const n = Number(maybeDecimal.toString?.());
      return Number.isFinite(n) ? n : maybeDecimal.toString?.();
    }
    if (Array.isArray(value)) return value.map(toJsonSafe);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = toJsonSafe(v);
    return out;
  }
  return value;
}
