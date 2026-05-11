/**
 * Mailchimp Marketing API client.
 *
 * Resolves credentials from the encrypted vault (env wins). Returns null if
 * the credential set is incomplete so callers can fall back to the stub
 * code path. Per CLAUDE.md §16 + docs/14, every send must also gate on the
 * `mailchimp.send` FeatureFlag — that check lives at the call site, not here.
 */

import mailchimp from "@mailchimp/mailchimp_marketing";

import { resolveCredential } from "@/server/services/integrations";

export type MailchimpClientConfig = {
  audienceListId: string;
  fromName: string;
  fromEmail: string;
};

export type ConfiguredMailchimp = {
  client: typeof mailchimp;
  config: MailchimpClientConfig;
};

/**
 * Build a configured Mailchimp client. Returns null when any required
 * credential is missing — callers must handle the null case (typically by
 * falling back to a stub send-intent record).
 */
export async function getMailchimpClient(): Promise<ConfiguredMailchimp | null> {
  const apiKey = await resolveCredential("mailchimp", "apiKey");
  const serverPrefix = await resolveCredential("mailchimp", "serverPrefix");
  const audienceListId = await resolveCredential("mailchimp", "audienceListId");
  const fromName = await resolveCredential("mailchimp", "fromName");
  const fromEmail = await resolveCredential("mailchimp", "fromEmail");

  if (!apiKey || !serverPrefix || !audienceListId || !fromName || !fromEmail) return null;

  mailchimp.setConfig({ apiKey, server: serverPrefix });

  return {
    client: mailchimp,
    config: { audienceListId, fromName, fromEmail },
  };
}
