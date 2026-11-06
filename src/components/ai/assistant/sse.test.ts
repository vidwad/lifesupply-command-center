import { describe, expect, it } from "vitest";

import { createSseParser } from "./sse";

describe("createSseParser", () => {
  it("delivers each data event however the chunks split it", () => {
    const events: unknown[] = [];
    const parser = createSseParser<unknown>((e) => events.push(e));
    parser.push('data: {"type":"delta","te');
    parser.push('xt":"Hel"}\n\ndata: {"type":"del');
    parser.push('ta","text":"lo"}\n\n');
    expect(events).toEqual([
      { type: "delta", text: "Hel" },
      { type: "delta", text: "lo" },
    ]);
  });

  it("accepts CRLF line endings, joins multi-line data, and ignores comments and non-JSON", () => {
    const events: unknown[] = [];
    const parser = createSseParser<unknown>((e) => events.push(e));
    parser.push(': keep-alive\r\n\r\ndata: {"a":\r\ndata: 1}\r\n\r\ndata: not json\r\n\r\n');
    expect(events).toEqual([{ a: 1 }]);
  });

  it("flushes a final event the stream ended without terminating", () => {
    const events: unknown[] = [];
    const parser = createSseParser<unknown>((e) => events.push(e));
    parser.push('data: {"type":"done"}');
    expect(events).toEqual([]);
    parser.flush();
    expect(events).toEqual([{ type: "done" }]);
    parser.flush();
    expect(events).toHaveLength(1);
  });
});
