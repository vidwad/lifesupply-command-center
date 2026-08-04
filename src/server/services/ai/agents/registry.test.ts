import { describe, expect, it } from "vitest";

import { ALL_PERMISSION_KEYS } from "@/lib/permissions";

import { AGENT_KEYS } from "./keys";
import { AGENT_DEFINITIONS, getAgent, listAgents } from "./registry";
import { AGENT_TOOLS } from "./tools";
import { AGENT_BUILTIN_TEMPLATES } from "@/server/services/prompt-templates/agent-templates";

describe("agent registry integrity", () => {
  it("defines every agent key exactly once", () => {
    expect(Object.keys(AGENT_DEFINITIONS).sort()).toEqual([...AGENT_KEYS].sort());
    expect(listAgents()).toHaveLength(AGENT_KEYS.length);
  });

  it("every agent references only registered tools", () => {
    for (const agent of listAgents()) {
      expect(agent.toolKeys.length).toBeGreaterThan(0);
      for (const toolKey of agent.toolKeys) {
        expect(AGENT_TOOLS[toolKey], `tool ${toolKey} for ${agent.key}`).toBeDefined();
      }
    }
  });

  it("every agent's permissions are real permission keys", () => {
    const valid = new Set<string>(ALL_PERMISSION_KEYS);
    for (const agent of listAgents()) {
      expect(valid.has(agent.runPermission), `runPermission of ${agent.key}`).toBe(true);
    }
    for (const tool of Object.values(AGENT_TOOLS)) {
      expect(valid.has(tool.permission), `permission of tool ${tool.key}`).toBe(true);
    }
  });

  it("every tool is declared read-only", () => {
    for (const tool of Object.values(AGENT_TOOLS)) {
      expect(tool.readonly, `tool ${tool.key}`).toBe(true);
    }
  });

  it("every agent has a builtin prompt template", () => {
    for (const agent of listAgents()) {
      const template = AGENT_BUILTIN_TEMPLATES[agent.templateKey];
      expect(template, `template ${agent.templateKey}`).toBeDefined();
      // Templates must carry the injection defense + JSON contract.
      expect(template!.systemPrompt).toContain("UNTRUSTED DATA");
      expect(template!.systemPrompt).toContain("cannot take any action");
      expect(template!.systemPrompt).toContain('"summary"');
      expect(template!.userTemplate).toContain("{{context}}");
    }
  });

  it("getAgent rejects unknown keys", () => {
    expect(getAgent("does_not_exist")).toBeNull();
    expect(getAgent("management_briefing")?.name).toMatch(/Briefing/);
  });
});
