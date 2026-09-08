/**
 * Acknowledgment and notification deliveries (WB-704): two separate
 * deliveries per inquiry, each with its own state and attempt count.
 *
 * Sending is gated twice: the `public_inquiry.send` feature flag (default
 * off; a kill switch) and a configured email client. While either is
 * missing, deliveries are recorded as `skipped`, never as sent. When
 * `PUBLIC_INQUIRY_SINK_EMAIL` is set, every message goes to that sink
 * instead of the visitor or the owner: that is the controlled test the
 * guide requires before real sends are approved. A delivery already `sent`
 * is never sent again; a failure records a generic error and counts an
 * attempt, up to `MAX_ATTEMPTS`.
 */
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { getEmailClient, type ConfiguredEmail } from "@/server/integrations/email/client";
import {
  redactForLog,
  type DeliveryState,
  type InquiryRecord,
} from "@/server/public-inquiry/contract";
import { getInquiryStore, type InquiryStore } from "@/server/public-inquiry/store";
import { isFeatureOn } from "@/server/services/feature-flags";

export const MAX_ATTEMPTS = 3;

type Kind = "acknowledgment" | "notification";

export interface DeliveryDeps {
  store?: InquiryStore;
  email?: ConfiguredEmail | null;
  sendOn?: () => Promise<boolean>;
  sink?: string | null;
  now?: () => Date;
}

function recipientFor(kind: Kind, record: InquiryRecord, sink: string | null) {
  if (sink) return sink;
  return kind === "acknowledgment" ? record.contact.email : record.ownerChannel;
}

function envelopeFor(kind: Kind, record: InquiryRecord, to: string) {
  if (kind === "acknowledgment") {
    return {
      to: [to],
      subject: `LifeSupply has received your inquiry (${record.reference})`,
      text: [
        `Thank you. LifeSupply has received your inquiry and will respond from the team responsible for it.`,
        `Reference: ${record.reference}`,
        `If you did not send this, no action is needed.`,
      ].join("\n\n"),
    };
  }
  // The owner notification carries the reference and intent, not the visitor's details:
  // staff open the record in the Command Center.
  return {
    to: [to],
    subject: `New public inquiry ${record.reference}: ${record.intent.replace("_", " ")}`,
    text: [
      `A new inquiry was received on the public website.`,
      `Reference: ${record.reference}`,
      `Intent: ${record.intent}`,
      `Source: ${record.sourceBrand} ${record.sourcePath}`,
      `Open the Command Center queue to view and assign it.`,
    ].join("\n"),
  };
}

function withState(
  record: InquiryRecord,
  kind: Kind,
  state: DeliveryState,
  extra: Partial<InquiryRecord[Kind]>,
) {
  const current = record[kind];
  return { [kind]: { ...current, ...extra, state } } as Partial<Pick<InquiryRecord, Kind>>;
}

/** Attempt both deliveries for one inquiry. Safe to call repeatedly. */
export async function attemptDeliveries(id: string, deps: DeliveryDeps = {}) {
  const store = deps.store ?? getInquiryStore();
  const record = await store.get(id);
  if (!record) return null;
  const sendOn = deps.sendOn ?? (() => isFeatureOn(FEATURE_FLAGS.PUBLIC_INQUIRY_SEND));
  const email = deps.email === undefined ? getEmailClient() : deps.email;
  const sink =
    deps.sink === undefined ? process.env.PUBLIC_INQUIRY_SINK_EMAIL?.trim() || null : deps.sink;
  const now = deps.now?.() ?? new Date();

  const enabled = (await sendOn()) && email !== null;
  let current = record;
  for (const kind of ["acknowledgment", "notification"] as const) {
    const state = current[kind];
    if (state.state === "sent") continue;
    if (!enabled) {
      if (state.state !== "skipped") {
        current =
          (await store.update(id, withState(current, kind, "skipped", { lastError: null }))) ??
          current;
      }
      continue;
    }
    if (state.attempts >= MAX_ATTEMPTS) continue;
    const to = recipientFor(kind, current, sink);
    try {
      await email!.send(envelopeFor(kind, current, to));
      current =
        (await store.update(
          id,
          withState(current, kind, "sent", {
            attempts: state.attempts + 1,
            sentAt: now,
            lastError: null,
          }),
        )) ?? current;
      await writeAudit({
        action: `public_inquiry.${kind}_delivered`,
        entityType: "PublicInquiry",
        entityId: id,
        afterData: { ...redactForLog(current), sink: sink !== null },
      });
    } catch {
      current =
        (await store.update(
          id,
          withState(current, kind, "failed", {
            attempts: state.attempts + 1,
            lastError: "Delivery failed",
          }),
        )) ?? current;
      await writeAudit({
        action: `public_inquiry.${kind}_failed`,
        entityType: "PublicInquiry",
        entityId: id,
        afterData: { ...redactForLog(current), attempts: state.attempts + 1 },
      });
    }
  }
  return current;
}
