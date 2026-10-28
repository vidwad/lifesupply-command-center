/**
 * OpenAI-only canaries (2026-10-27).
 *
 * The product owner retired the Anthropic provider: every analysis feature
 * and Product Studio run on OpenAI. These hold that in place so a template,
 * a setting or an import cannot quietly bring a second provider back.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AGENT_BUILTIN_TEMPLATES } from "../prompt-templates/agent-templates";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}

describe("OpenAI is the only AI provider", () => {
  it("the Anthropic SDK and integration are gone", () => {
    expect(existsSync(join(ROOT, "src/server/integrations/anthropic"))).toBe(false);
    const pkg = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };
    expect(pkg.dependencies["@anthropic-ai/sdk"]).toBeUndefined();
    for (const file of walk(join(ROOT, "src"))) {
      const code = readFileSync(file, "utf8");
      expect(code, file).not.toMatch(
        /@anthropic-ai\/sdk|integrations\/anthropic|api\.anthropic\.com/,
      );
    }
  });

  it("every built-in template and the agent templates name OpenAI", () => {
    const templates = read("src/server/services/prompt-templates/index.ts");
    expect(templates).not.toContain('provider: "anthropic"');
    expect(templates).toContain('active?.provider ?? "openai"');
    for (const template of Object.values(AGENT_BUILTIN_TEMPLATES)) {
      expect(template.provider).toBe("openai");
    }
  });

  it("the call wrapper, settings and health probe know one provider", () => {
    const call = read("src/server/services/ai/call.ts");
    expect(call).toContain('modelProvider: "openai"');
    expect(call).not.toMatch(/anthropic/i);
    const settings = read("src/server/services/system-settings/index.ts");
    expect(settings).not.toContain("ai.default_provider");
    expect(read("src/lib/env.ts")).not.toContain("ANTHROPIC");
    const health = read("src/app/api/health/route.ts");
    expect(health).toContain('{ name: "openai", status: "ok" }');
    expect(health).not.toMatch(/anthropic/i);
  });
});
