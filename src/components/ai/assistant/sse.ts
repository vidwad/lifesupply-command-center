/**
 * A server-sent-events reader for the browser (2026-11-06). Pure: feed it
 * the text chunks a fetch body yields and it calls back with each parsed
 * `data:` event, however the chunks split the stream. Events that are not
 * JSON are dropped; a trailing partial event waits for the next chunk.
 */
export type SseParser = {
  push(chunk: string): void;
  /** Hands over whatever a stream left unterminated when it ended. */
  flush(): void;
};

export function createSseParser<T>(onEvent: (event: T) => void): SseParser {
  let buffer = "";

  const deliver = (block: string) => {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!data) return;
    try {
      onEvent(JSON.parse(data) as T);
    } catch {
      // Not one of ours.
    }
  };

  return {
    push(chunk) {
      buffer += chunk;
      let at: number;
      while ((at = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const block = buffer.slice(0, at);
        buffer = buffer.slice(at).replace(/^\r?\n\r?\n/, "");
        deliver(block);
      }
    },
    flush() {
      if (buffer.trim()) deliver(buffer);
      buffer = "";
    },
  };
}

/** Reads a fetch body to its end, parsing events as they arrive. */
export async function readSseBody<T>(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: T) => void,
): Promise<void> {
  const parser = createSseParser<T>(onEvent);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.push(decoder.decode());
  parser.flush();
}
