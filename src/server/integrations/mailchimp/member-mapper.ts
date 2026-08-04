/**
 * Maps Mailchimp list members + abuse reports onto the Command Center consent
 * model (Phase 4 — docs/19). Pure, so the status→consent policy is unit-tested.
 *
 * Mapping policy:
 *   subscribed    → consentStatus subscribed, basis express, source mailchimp,
 *                   obtainedAt = timestamp_opt (falling back to last_changed);
 *                   clears any suppression.
 *   unsubscribed  → suppressed (mailchimp_unsubscribed)
 *   cleaned       → suppressed (mailchimp_cleaned_bounced) — hard bounce
 *   pending       → pending (double opt-in not confirmed)
 *   transactional → transactional status; basis transactional_only
 *   archived      → contact mirror only — archiving a list member is an
 *                   operator action, not consent revocation; customer consent
 *                   fields are left untouched.
 *   abuse report  → suppressed (mailchimp_abuse_complaint), status complained.
 */

export type MailchimpMember = {
  id: string;
  email_address: string;
  status: string; // subscribed | unsubscribed | cleaned | pending | transactional | archived
  timestamp_opt?: string | null;
  timestamp_signup?: string | null;
  last_changed?: string | null;
  tags?: { id?: number; name?: string }[] | null;
  merge_fields?: Record<string, unknown> | null;
};

/** Consent field patch to apply to the matched Customer; null = don't touch. */
export type CustomerConsentPatch = {
  consentStatus: string;
  consentBasis?: string;
  consentSource?: string;
  consentObtainedAt?: Date | null;
  consentExpiresAt?: Date | null;
  suppressionReason?: string | null;
  suppressedAt?: Date | null;
  mailchimpStatus: string;
} | null;

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? new Date(ms) : null;
}

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  return s.length === 0 ? null : s;
}

/** Tag names as a plain string array for the MarketingContact mirror. */
export function tagNames(member: MailchimpMember): string[] {
  return (member.tags ?? [])
    .map((t) => t.name?.trim())
    .filter((n): n is string => !!n && n.length > 0);
}

export function mapMemberToConsentPatch(member: MailchimpMember): CustomerConsentPatch {
  const changed = parseDate(member.last_changed);
  switch (member.status) {
    case "subscribed":
      return {
        consentStatus: "subscribed",
        consentBasis: "express",
        consentSource: "mailchimp",
        consentObtainedAt: parseDate(member.timestamp_opt) ?? changed,
        consentExpiresAt: null, // express consent does not expire
        suppressionReason: null,
        suppressedAt: null,
        mailchimpStatus: member.status,
      };
    case "unsubscribed":
      return {
        consentStatus: "unsubscribed",
        suppressionReason: "mailchimp_unsubscribed",
        suppressedAt: changed,
        mailchimpStatus: member.status,
      };
    case "cleaned":
      return {
        consentStatus: "cleaned",
        suppressionReason: "mailchimp_cleaned_bounced",
        suppressedAt: changed,
        mailchimpStatus: member.status,
      };
    case "pending":
      return { consentStatus: "pending", mailchimpStatus: member.status };
    case "transactional":
      return {
        consentStatus: "transactional",
        consentBasis: "transactional_only",
        consentSource: "mailchimp",
        mailchimpStatus: member.status,
      };
    case "archived":
      return null; // operator archive ≠ consent change
    default:
      return null; // unknown status — leave consent untouched
  }
}

/** Patch applied to a customer named in a Mailchimp abuse (spam) report. */
export function abuseComplaintPatch(reportedAt: Date | null): NonNullable<CustomerConsentPatch> {
  return {
    consentStatus: "complained",
    suppressionReason: "mailchimp_abuse_complaint",
    suppressedAt: reportedAt,
    mailchimpStatus: "complained",
  };
}
