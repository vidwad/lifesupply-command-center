/**
 * Zod schemas for AI templates that produce structured output. The DB
 * column `PromptTemplate.outputSchema` is a human-readable description; the
 * actual runtime validator lives here so the codebase stays the source of
 * truth for output shape.
 *
 * Why not store Zod in the DB: Zod schemas are code, not data. Storing a
 * schema as JSON and converting at runtime adds a JSON-Schema-to-Zod
 * dependency for no real benefit — admins shouldn't be hand-editing
 * structured-output validators anyway.
 *
 * The current 3 builtin templates are plain-text outputs, so this registry
 * is empty by design. It exists so Phase 2C+ AI features (e.g. classifying
 * exception severity, scoring product quality, extracting supplier price
 * lists) can opt-in to schema validation by adding an entry here.
 */

import { z } from "zod";

import type { AiOutputValidationError } from "./errors";

// Keep `z` referenced so the import is not flagged as type-only before any
// schema is registered. Once a real schema is added below this line can go.
void z;

const SCHEMAS: Record<string, z.ZodTypeAny | undefined> = {
  // Example for future use — uncomment and add fields when building
  // structured AI features:
  //
  // exception_classification: z.object({
  //   exceptionType: z.enum(["order_delay", "supplier_stock", ...]),
  //   severity: z.enum(["low", "medium", "high", "urgent"]),
  //   reason: z.string().min(5),
  //   confidence: z.number().min(0).max(1),
  // }),
};

export type ValidationResult =
  | { ok: true; parsed: unknown | null }
  | { ok: false; issues: string[] };

/**
 * Look up the Zod schema for a template key + version (currently keyed on
 * key only; bump to (key, version) when first version-divergent schema lands).
 *
 * Returns the parsed object on success. If the template has no schema, the
 * function returns ok with parsed=null — callers can store the raw text
 * unchanged.
 *
 * Output may arrive as raw JSON, or as JSON wrapped in a ```json fence (the
 * model's choice). Both are accepted.
 */
export function validateAiOutput(
  templateKey: string,
  rawOutput: string,
): ValidationResult {
  const schema = SCHEMAS[templateKey];
  if (!schema) return { ok: true, parsed: null };

  // Strip optional code fence so the model isn't penalised for being polite.
  const cleaned = rawOutput
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return {
      ok: false,
      issues: [`Output is not valid JSON: ${err instanceof Error ? err.message : "unknown"}`],
    };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      issues: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  }
  return { ok: true, parsed: result.data };
}

// Re-export for callers that want to surface the validation error directly.
export type { AiOutputValidationError };

export function hasSchema(templateKey: string): boolean {
  return Boolean(SCHEMAS[templateKey]);
}
