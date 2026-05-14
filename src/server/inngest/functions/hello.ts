/**
 * Hello-world Inngest function. Used to verify the worker registration +
 * event dispatch pipeline end-to-end without depending on BC connectivity.
 *
 * Trigger by sending event:
 *   await inngest.send({ name: "system/hello", data: { name: "World" } });
 *
 * Or via the Inngest dev UI when running locally.
 */
import { inngest } from "@/server/inngest/client";

type HelloPayload = { name?: string };

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    name: "Hello World",
    triggers: [{ event: "system/hello" }],
  },
  async ({ event, step }) => {
    const greeting = await step.run("compose-greeting", () => {
      const data = (event.data ?? {}) as HelloPayload;
      return `Hello, ${data.name ?? "World"}!`;
    });
    return { greeting };
  },
);
