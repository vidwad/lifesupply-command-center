"use client";

/**
 * Public inquiry form (WB-705). **Not published**: no page renders it, and a
 * canary keeps it that way until WEB-07 is recorded and the inquiry table
 * exists. It posts JSON to the Command Center intake and shows success only
 * when the server returns a reference, which the server does only after the
 * row is stored. A refresh or a second click re-sends the same idempotency
 * key, so it cannot create a second record.
 *
 * Privacy by construction: the body carries the page path without a query
 * string; nothing is put into the URL; marketing consent is a separate,
 * unchecked box; the service-response consent is required to submit.
 */
import { useId, useState } from "react";

import { INTENT_FIELDS, type InquiryIntent } from "@/server/public-inquiry/contract";

const FIELD_LABELS: Record<string, string> = {
  clinicType: "Clinic type",
  location: "Location (city, province or state)",
  approximateSize: "Approximate size",
  currentStage: "Current stage",
  targetOpening: "Target opening",
  interest: "What you are interested in",
  rooms: "Rooms or functions to equip",
  categories: "Categories",
  currentSupplier: "Current supplier (optional)",
  organizationType: "Organization type",
  programStage: "Program stage",
  pathways: "Pathways of interest",
  regions: "Regions",
  distributionRights: "Distribution rights held",
  productDataReady: "Product data available",
  purpose: "Purpose of the request",
  businessType: "Business type",
  counterpartyType: "Counterparty type",
  topic: "Topic",
};

type PersistedIntent = Exclude<InquiryIntent, "existing_order_support">;

function randomKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function InquiryForm({
  intent,
  intakeUrl,
  sourceBrand,
  sourcePath,
}: {
  intent: PersistedIntent;
  intakeUrl: string;
  sourceBrand: "corporate" | "lifesupply" | "wellmart" | "clinics" | "balkowitsch";
  sourcePath: string;
}) {
  const id = useId();
  const [idempotencyKey] = useState(randomKey);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "sent"; reference: string }
    | { kind: "error"; message: string; issues?: { path: string; message: string }[] }
  >({ kind: "idle" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields: Record<string, string> = {};
    for (const key of INTENT_FIELDS[intent]) {
      const value = String(form.get(`field:${key}`) ?? "").trim();
      if (value) fields[key] = value;
    }
    const body = {
      intent,
      sourceBrand,
      sourcePath: sourcePath.split("?")[0]?.split("#")[0] ?? "/",
      contact: {
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        ...(String(form.get("phone") ?? "").trim()
          ? { phone: String(form.get("phone")).trim() }
          : {}),
        ...(String(form.get("organization") ?? "").trim()
          ? { organization: String(form.get("organization")).trim() }
          : {}),
        ...(String(form.get("region") ?? "").trim()
          ? { region: String(form.get("region")).trim() }
          : {}),
      },
      fields,
      consent: { serviceResponse: true as const, marketing: form.get("marketing") === "on" },
      idempotencyKey,
      website: String(form.get("website") ?? ""),
    };
    setState({ kind: "sending" });
    try {
      const response = await fetch(intakeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        reference?: string;
        error?: string;
        issues?: { path: string; message: string }[];
      };
      if (response.ok && data.reference) {
        setState({ kind: "sent", reference: data.reference });
      } else {
        setState({
          kind: "error",
          message: data.error ?? "The inquiry could not be sent.",
          issues: data.issues,
        });
      }
    } catch {
      setState({
        kind: "error",
        message: "The inquiry could not be sent. Please use the contact directory.",
      });
    }
  }

  if (state.kind === "sent") {
    return (
      <p
        role="status"
        className="border-l-4 border-[var(--lsh-brand-red)] pl-4 leading-7 text-[var(--lsh-charcoal)]"
      >
        Thank you. Your inquiry has been received. Reference {state.reference}.
      </p>
    );
  }

  const input =
    "w-full border border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] px-3 py-2 text-sm text-[var(--lsh-charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--lsh-brand-red)]";
  const issue = (path: string) =>
    state.kind === "error" && state.issues?.find((entry) => entry.path === path)?.message;

  return (
    <form onSubmit={submit} noValidate className="grid gap-5" aria-describedby={`${id}-consent`}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span>Name</span>
          <input
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            className={input}
            aria-invalid={Boolean(issue("contact.name"))}
          />
          {issue("contact.name") && (
            <span className="text-xs text-[var(--lsh-brand-red)]" role="alert">
              {issue("contact.name")}
            </span>
          )}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className={input}
            aria-invalid={Boolean(issue("contact.email"))}
          />
          {issue("contact.email") && (
            <span className="text-xs text-[var(--lsh-brand-red)]" role="alert">
              {issue("contact.email")}
            </span>
          )}
        </label>
        <label className="grid gap-1 text-sm">
          <span>Phone (optional)</span>
          <input name="phone" maxLength={40} autoComplete="tel" className={input} />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Organization (optional)</span>
          <input
            name="organization"
            maxLength={160}
            autoComplete="organization"
            className={input}
          />
        </label>
        <label className="grid gap-1 text-sm md:col-span-2">
          <span>Region (optional)</span>
          <input name="region" maxLength={80} className={input} />
        </label>
        {INTENT_FIELDS[intent].map((key) => (
          <label key={key} className="grid gap-1 text-sm md:col-span-2">
            <span>{FIELD_LABELS[key] ?? key}</span>
            <input name={`field:${key}`} maxLength={500} className={input} />
          </label>
        ))}
      </div>
      {/* Honeypot: hidden from people, filled by bots; the server refuses a non-empty value. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p id={`${id}-consent`} className="text-sm leading-6 text-[var(--lsh-muted)]">
        By sending this inquiry you agree that LifeSupply may use these details to respond to it. Do
        not include medical information, prescriptions, identity documents, or share certificates.
      </p>
      <label className="flex items-start gap-2 text-sm text-[var(--lsh-muted)]">
        <input name="marketing" type="checkbox" className="mt-1" />
        <span>
          Also send me occasional LifeSupply news by email (optional; separate from this inquiry).
        </span>
      </label>
      {state.kind === "error" && (
        <p
          role="alert"
          className="border-l-4 border-[var(--lsh-brand-red)] pl-4 text-sm leading-6 text-[var(--lsh-charcoal)]"
        >
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={state.kind === "sending"}
        className="lsh-primary-action lsh-display inline-flex items-center gap-2 self-start px-5 py-3 text-[11px]"
      >
        {state.kind === "sending" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
