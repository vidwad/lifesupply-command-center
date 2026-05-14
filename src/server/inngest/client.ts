/**
 * Inngest client. Single source of truth used by:
 *   - the web service to SEND events (sync triggers, etc.)
 *   - the background worker to REGISTER functions that handle them
 *
 * In production, INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY are read from env
 * automatically by the SDK. In local dev, the bundled Inngest dev server
 * works with no keys at all.
 */
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "lifesupply-command-center",
});
