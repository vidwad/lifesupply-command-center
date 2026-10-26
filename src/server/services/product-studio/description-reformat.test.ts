import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const read = (name: string) =>
  readFileSync(join(__dirname, name), "utf8")
    .replace(/\r\n/g, "\n")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

describe("the reformat path keeps its guard", () => {
  it("records the call, refuses a rewrite that lost facts, and clears the upload mark", () => {
    const code = read("description.ts");
    const reformat = code.slice(
      code.indexOf("export async function reformatProductStudioDescription"),
    );
    expect(reformat.indexOf("aiOutput.create")).toBeLessThan(
      reformat.indexOf("productStudioProject.update"),
    );
    expect(reformat).toContain("missingFacts(original, text)");
    expect(reformat).toContain('status: lost.length > 0 ? "rejected" : "generated"');
    expect(reformat).toContain("descriptionUploadApprovedAt: null");
    // The refusal happens before any write to the project.
    expect(reformat.indexOf("if (lost.length > 0)")).toBeLessThan(
      reformat.indexOf("productStudioProject.update"),
    );
  });

  it("the reformat call is text-only: no tools, no web search, no images", () => {
    const openai = read("openai.ts");
    const call = openai.slice(
      openai.indexOf("export async function reformatListingDescription"),
      openai.indexOf("export async function researchProduct"),
    );
    expect(call.length).toBeGreaterThan(100);
    expect(call).not.toMatch(/tools:|web_search|input_image/);
  });

  it("the prompt forbids adding or removing facts and links", () => {
    const prompt = read("reformat-prompt.ts");
    expect(prompt).toContain("Do not add facts, do not remove facts");
    expect(prompt).toContain("Do not add URLs, links, citations, retailer names");
    expect(prompt).toContain('bullet lines beginning with "- "');
  });
});
