import { describe, expect, it } from "vitest";

import { parseCsv, pick, pickDate, pickNumber } from "./csv";

describe("parseCsv", () => {
  it("parses a simple header + row", () => {
    const text = "name,email\nJane,jane@x.io\nBob,bob@x.io";
    const { rows, headers, warnings } = parseCsv(text);
    expect(headers).toEqual(["name", "email"]);
    expect(rows).toEqual([
      { name: "Jane", email: "jane@x.io" },
      { name: "Bob", email: "bob@x.io" },
    ]);
    expect(warnings).toEqual([]);
  });

  it("trims headers and values", () => {
    const text = "  name  ,  email  \n  Jane  ,  jane@x.io  ";
    const { rows, headers } = parseCsv(text);
    expect(headers).toEqual(["name", "email"]);
    expect(rows).toEqual([{ name: "Jane", email: "jane@x.io" }]);
  });

  it("handles quoted fields with embedded commas and quotes", () => {
    const text = `name,note\n"Smith, J.","She said ""hi"""`;
    const { rows } = parseCsv(text);
    expect(rows).toEqual([{ name: "Smith, J.", note: 'She said "hi"' }]);
  });

  it("skips greedy empty rows", () => {
    const text = "a,b\n1,2\n\n\n3,4\n";
    const { rows } = parseCsv(text);
    expect(rows).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });
});

describe("pick", () => {
  it("returns the first non-empty matching column", () => {
    const row = { customer_id: "", id: "abc", Email: "x@y.z" };
    expect(pick(row, ["customer_id", "id"])).toBe("abc");
    expect(pick(row, ["email", "Email"])).toBe("x@y.z");
  });

  it("returns null when no candidates match", () => {
    expect(pick({ a: "1" }, ["b", "c"])).toBeNull();
  });

  it("treats whitespace-only values as missing", () => {
    expect(pick({ a: "   " }, ["a"])).toBeNull();
  });
});

describe("pickNumber", () => {
  it("parses plain integers and decimals", () => {
    expect(pickNumber({ x: "42" }, ["x"])).toBe(42);
    expect(pickNumber({ x: "3.14" }, ["x"])).toBe(3.14);
  });

  it("strips currency symbols, commas, and whitespace", () => {
    expect(pickNumber({ x: "$1,234.56" }, ["x"])).toBe(1234.56);
    expect(pickNumber({ x: " $ 99 " }, ["x"])).toBe(99);
  });

  it("interprets parentheses as negatives (accounting style)", () => {
    expect(pickNumber({ x: "(123.45)" }, ["x"])).toBe(-123.45);
  });

  it("returns null for empty or non-numeric values", () => {
    expect(pickNumber({ x: "" }, ["x"])).toBeNull();
    expect(pickNumber({ x: "abc" }, ["x"])).toBeNull();
    expect(pickNumber({ x: "1.2.3" }, ["x"])).toBeNull();
  });
});

describe("pickDate", () => {
  it("parses ISO date strings", () => {
    const d = pickDate({ x: "2026-04-15" }, ["x"]);
    expect(d).toBeInstanceOf(Date);
    expect(d?.toISOString().slice(0, 10)).toBe("2026-04-15");
  });

  it("returns null for invalid dates", () => {
    expect(pickDate({ x: "not a date" }, ["x"])).toBeNull();
    expect(pickDate({ x: "" }, ["x"])).toBeNull();
  });
});
