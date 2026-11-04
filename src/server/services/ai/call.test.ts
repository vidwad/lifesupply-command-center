/**
 * The AI call's output allowance (2026-11-04). A production analyst answer
 * came back empty with exactly 1,024 output tokens: the GPT-5 family spends
 * the allowance on reasoning before it writes, and the cap was a hard-coded
 * 1,024 while the admin's `ai.max_output_tokens` setting went unread.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const call = readFileSync(join(__dirname, "call.ts"), "utf8").replace(/\r\n/g, "\n");

describe("the AI call's output allowance", () => {
  it("defaults to the admin setting, never a hard-coded 1,024", () => {
    expect(call).toContain("options.maxOutputTokens ?? (await resolveMaxOutputTokens())");
    expect(call).toContain('getSetting("ai.max_output_tokens")');
    expect(call).not.toMatch(/maxOutputTokens \?\? 1024/);
  });

  it("refuses to return an empty answer that was cut off, so nothing blank is stored", () => {
    expect(call).toContain('if (!output && choice?.finish_reason === "length")');
    expect(call).toContain("throw new AiOutputTruncatedError(maxTokens)");
  });
});
