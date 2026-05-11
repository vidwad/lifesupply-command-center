import { describe, expect, it } from "vitest";

import { applyPlaceholders } from "./index";

describe("applyPlaceholders", () => {
  it("substitutes a single variable", () => {
    expect(applyPlaceholders("Hello {{name}}!", { name: "Vid" })).toBe("Hello Vid!");
  });

  it("substitutes multiple occurrences of the same variable", () => {
    expect(
      applyPlaceholders("{{x}} and {{x}} again, but not {{y}}", { x: "1" }),
    ).toBe("1 and 1 again, but not {{y}}");
  });

  it("leaves unknown variables in place for visibility", () => {
    expect(applyPlaceholders("{{a}} {{b}}", { a: "1" })).toBe("1 {{b}}");
  });

  it("does not interpret regex metacharacters in the value", () => {
    expect(applyPlaceholders("Pre {{x}} post", { x: "$1.50 (a, b)" })).toBe(
      "Pre $1.50 (a, b) post",
    );
  });

  it("preserves literal {{ }} that does not match a variable name", () => {
    expect(applyPlaceholders("note: {{ this is not a var }}", { x: "1" })).toBe(
      "note: {{ this is not a var }}",
    );
  });

  it("returns the template unchanged when no variables are provided", () => {
    expect(applyPlaceholders("Hello {{name}}!", {})).toBe("Hello {{name}}!");
  });
});
