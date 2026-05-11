import { describe, expect, it } from "vitest";

import { csvResponse, toCsv } from "./csv";

type Row = { name: string; total: number; note: string | null; createdAt: Date };

describe("toCsv", () => {
  it("emits header row + a row per record", () => {
    const csv = toCsv<Row>({
      headers: [
        { key: "name", label: "Name", get: (r) => r.name },
        { key: "total", label: "Total", get: (r) => r.total },
      ],
      rows: [
        { name: "A", total: 1, note: null, createdAt: new Date(0) },
        { name: "B", total: 2, note: null, createdAt: new Date(0) },
      ],
    });
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toBe("Name,Total");
    expect(lines[1]).toBe("A,1");
    expect(lines[2]).toBe("B,2");
  });

  it("quotes and escapes fields with commas, quotes, or newlines", () => {
    const csv = toCsv<{ x: string }>({
      headers: [{ key: "x", label: "X", get: (r) => r.x }],
      rows: [{ x: 'has,"comma" and quote' }, { x: "line\nbreak" }],
    });
    const lines = csv.trim().split("\r\n");
    expect(lines[1]).toBe('"has,""comma"" and quote"');
    expect(lines[2]).toBe('"line\nbreak"');
  });

  it("formats dates as ISO strings and treats null/undefined as empty", () => {
    const d = new Date("2026-04-15T12:00:00Z");
    const csv = toCsv<{ when: Date | null; flag: boolean | undefined }>({
      headers: [
        { key: "when", label: "When", get: (r) => r.when },
        { key: "flag", label: "Flag", get: (r) => r.flag },
      ],
      rows: [
        { when: d, flag: true },
        { when: null, flag: undefined },
      ],
    });
    const lines = csv.trim().split("\r\n");
    expect(lines[1]).toBe("2026-04-15T12:00:00.000Z,true");
    expect(lines[2]).toBe(",");
  });
});

describe("csvResponse", () => {
  it("returns a 200 response with download headers", async () => {
    const res = csvResponse("test.csv", "a,b\n1,2\n");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="test.csv"',
    );
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.text()).toBe("a,b\n1,2\n");
  });
});
