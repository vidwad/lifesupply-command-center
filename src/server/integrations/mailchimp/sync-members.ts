/**
 * Mailchimp → Postgres subscriber + suppression read sync (Phase 4 — docs/19).
 *
 * Walks the audience list's members and abuse reports, then:
 *   1. Upserts a MarketingContact mirror row per member (raw status, tags,
 *      merge fields, status-changed timestamp), keyed by
 *      (sourceSystem "mailchimp", sourceId = member id).
 *   2. Applies the consent patch (member-mapper policy) to every Customer
 *      whose email matches — registered AND guest rows alike, across stores.
 *   3. Applies abuse-report suppression (status "complained") last, so a
 *      complaint always wins over the member's list status.
 *
 * READ-ONLY toward Mailchimp. Never writes back. Consent changes are counted
 * and audit-logged at the sync level by the Inngest wrapper (per-row auditing
 * would flood the log; the sync log + counts are the trail).
 */
import { prisma } from "@/server/db/client";

import {
  abuseComplaintPatch,
  mapMemberToConsentPatch,
  normalizeEmail,
  tagNames,
  type CustomerConsentPatch,
  type MailchimpMember,
} from "./member-mapper";

export const MAILCHIMP_SOURCE_SYSTEM = "mailchimp";
const PAGE_SIZE = 1000; // Mailchimp max count per page
const HARD_CAP_MEMBERS = 500_000;

export type SyncMailchimpInput = {
  client: {
    lists: unknown;
  };
  audienceListId: string;
  onProgress?: (counts: SyncMailchimpCounts) => void | Promise<void>;
};

export type SyncMailchimpCounts = {
  membersScanned: number;
  contactsUpserted: number;
  customersUpdated: number;
  customersUnmatched: number;
  suppressedApplied: number; // unsubscribed/cleaned patches applied to customers
  complaintsApplied: number; // abuse-report suppressions applied to customers
  errorMessages: string[];
};

type MembersApi = {
  getListMembersInfo: (
    listId: string,
    opts: { count: number; offset: number; fields?: string[] },
  ) => Promise<{ members?: MailchimpMember[]; total_items?: number }>;
  getListAbuseReports: (
    listId: string,
    opts?: { count?: number; offset?: number },
  ) => Promise<{ abuse_reports?: { email_address?: string; date?: string }[] }>;
};

/** email → Customer ids (registered + guest may both match one email). */
async function loadCustomerEmailMap(): Promise<Map<string, string[]>> {
  const rows = await prisma.customer.findMany({
    where: { email: { not: null }, deletedAt: null },
    select: { id: true, email: true },
  });
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const email = normalizeEmail(r.email);
    if (!email) continue;
    const list = map.get(email);
    if (list) list.push(r.id);
    else map.set(email, [r.id]);
  }
  return map;
}

async function applyConsentPatch(
  customerIds: string[],
  patch: NonNullable<CustomerConsentPatch>,
): Promise<number> {
  const { consentStatus, mailchimpStatus, ...rest } = patch;
  const result = await prisma.customer.updateMany({
    where: { id: { in: customerIds } },
    data: {
      consentStatus: consentStatus as never,
      mailchimpStatus,
      ...(rest.consentBasis !== undefined ? { consentBasis: rest.consentBasis as never } : {}),
      ...(rest.consentSource !== undefined ? { consentSource: rest.consentSource } : {}),
      ...(rest.consentObtainedAt !== undefined
        ? { consentObtainedAt: rest.consentObtainedAt }
        : {}),
      ...(rest.consentExpiresAt !== undefined ? { consentExpiresAt: rest.consentExpiresAt } : {}),
      ...(rest.suppressionReason !== undefined
        ? { suppressionReason: rest.suppressionReason }
        : {}),
      ...(rest.suppressedAt !== undefined ? { suppressedAt: rest.suppressedAt } : {}),
    },
  });
  return result.count;
}

export async function syncMailchimpMembers(
  input: SyncMailchimpInput,
): Promise<SyncMailchimpCounts> {
  const counts: SyncMailchimpCounts = {
    membersScanned: 0,
    contactsUpserted: 0,
    customersUpdated: 0,
    customersUnmatched: 0,
    suppressedApplied: 0,
    complaintsApplied: 0,
    errorMessages: [],
  };

  const lists = input.client.lists as MembersApi;
  const emailMap = await loadCustomerEmailMap();

  // ---- Pass 1: members ----
  let offset = 0;
  while (counts.membersScanned < HARD_CAP_MEMBERS) {
    const page = await lists.getListMembersInfo(input.audienceListId, {
      count: PAGE_SIZE,
      offset,
      fields: [
        "members.id",
        "members.email_address",
        "members.status",
        "members.timestamp_opt",
        "members.timestamp_signup",
        "members.last_changed",
        "members.tags",
        "members.merge_fields",
        "total_items",
      ],
    });
    const members = page.members ?? [];
    if (members.length === 0) break;

    for (const member of members) {
      counts.membersScanned++;
      try {
        const email = normalizeEmail(member.email_address);
        if (!email) continue;

        const customerIds = emailMap.get(email) ?? [];

        // Mirror row (always, even when no customer matches — the contact is
        // still real and future customers may match it).
        await prisma.marketingContact.upsert({
          where: {
            sourceSystem_sourceId: {
              sourceSystem: MAILCHIMP_SOURCE_SYSTEM,
              sourceId: member.id,
            },
          },
          create: {
            sourceSystem: MAILCHIMP_SOURCE_SYSTEM,
            sourceId: member.id,
            email,
            status: member.status,
            consentStatus: (mapMemberToConsentPatch(member)?.consentStatus ?? "unknown") as never,
            tags: tagNames(member),
            mergeFields: (member.merge_fields ?? undefined) as never,
            statusChangedAt: member.last_changed ? new Date(member.last_changed) : null,
            customerId: customerIds[0] ?? null,
          },
          update: {
            email,
            status: member.status,
            consentStatus: (mapMemberToConsentPatch(member)?.consentStatus ?? "unknown") as never,
            tags: tagNames(member),
            mergeFields: (member.merge_fields ?? undefined) as never,
            statusChangedAt: member.last_changed ? new Date(member.last_changed) : null,
            customerId: customerIds[0] ?? null,
          },
        });
        counts.contactsUpserted++;

        // Consent patch onto matched customers.
        const patch = mapMemberToConsentPatch(member);
        if (patch && customerIds.length > 0) {
          const updated = await applyConsentPatch(customerIds, patch);
          counts.customersUpdated += updated;
          if (patch.suppressionReason) counts.suppressedApplied += updated;
        } else if (patch && customerIds.length === 0) {
          counts.customersUnmatched++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        if (counts.errorMessages.length < 20) {
          counts.errorMessages.push(`Member ${member.email_address}: ${msg}`);
        }
      }
    }

    if (input.onProgress) await input.onProgress({ ...counts });
    if (members.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // ---- Pass 2: abuse reports — complaints always win ----
  try {
    const reports = await lists.getListAbuseReports(input.audienceListId, { count: 1000 });
    for (const report of reports.abuse_reports ?? []) {
      const email = normalizeEmail(report.email_address);
      if (!email) continue;
      const customerIds = emailMap.get(email) ?? [];
      const reportedAt = report.date ? new Date(report.date) : null;
      if (customerIds.length > 0) {
        const updated = await applyConsentPatch(customerIds, abuseComplaintPatch(reportedAt));
        counts.complaintsApplied += updated;
      }
      await prisma.marketingContact.updateMany({
        where: { sourceSystem: MAILCHIMP_SOURCE_SYSTEM, email },
        data: { consentStatus: "complained" as never, status: "complained" },
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    counts.errorMessages.push(`Abuse reports: ${msg}`);
  }

  return counts;
}
