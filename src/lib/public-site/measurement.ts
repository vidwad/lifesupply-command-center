/**
 * Measurement taxonomy and consent model for the public site (Stage 8,
 * WB-803). This module defines what may be measured and how it is marked
 * up. It loads no script, sets no cookie, and sends nothing anywhere.
 *
 * Markup: an element that represents a measurable intent carries
 * `data-measure="<event>"` plus a small set of allowlisted, non-sensitive
 * parameters (`data-measure-brand`, `data-measure-intent`,
 * `data-measure-document-type`). A consented loader, if one is ever
 * approved, binds to those attributes; until then they are inert. The
 * page path is never a parameter here because the loader can read it, and
 * no parameter may carry free text, an email, a name, or a query string.
 *
 * The one server-confirmed event, `inquiry_submitted`, is recorded by the
 * intake after the row is persisted (`src/server/measurement/events.ts`);
 * a browser can never emit it.
 *
 * Interpretation rule (guide §Stage 8): an outbound click is an intent
 * signal, not a sale. Nothing in this taxonomy is revenue.
 */
import type { ActionKey } from "@/lib/public-site/actions";
import type { BrandKey } from "@/lib/public-site/brands";

export const MEASUREMENT_EVENTS = {
  brand_destination_click: {
    description: "A visitor followed a link to one of the four operating sites.",
    params: ["brand"],
    source: "browser",
  },
  clinic_consultation_click: {
    description: "A visitor followed the LifeSupply Clinics consultation link.",
    params: ["brand"],
    source: "browser",
  },
  equipment_quote_start: {
    description: "A visitor followed the LifeSupply Clinics equipment-quote link.",
    params: ["brand"],
    source: "browser",
  },
  inquiry_submitted: {
    description: "The Command Center persisted a public inquiry. Server-confirmed only.",
    params: ["intent", "brand"],
    source: "server",
  },
  investor_materials_requested: {
    description: "A visitor opened the investor-materials channel.",
    params: [],
    source: "browser",
  },
  public_document_download: {
    description: "A visitor followed a published public document's download path.",
    params: ["documentType"],
    source: "browser",
  },
} as const;

export type MeasurementEvent = keyof typeof MEASUREMENT_EVENTS;

export type MeasurementParams = {
  brand?: BrandKey;
  intent?: string;
  documentType?: string;
};

/**
 * Consent model. Analytics consent is denied until a visitor grants it
 * through a control that does not exist yet; no cookie or storage records a
 * choice today. "Necessary" covers only what the site already does: serving
 * pages and honouring the visitor's own mail and phone applications.
 */
export type ConsentState = { necessary: "granted"; analytics: "granted" | "denied" };

export const DEFAULT_CONSENT: ConsentState = { necessary: "granted", analytics: "denied" };

/** Which browser event a registry action represents, if any. */
export function eventForAction(action: ActionKey): MeasurementEvent | null {
  switch (action) {
    case "shop_lifesupply":
    case "browse_clinic_supplies":
    case "shop_wellmart":
    case "shop_clinics":
    case "shop_balkowitsch":
    case "view_clinic_projects":
      return "brand_destination_click";
    case "plan_clinic":
      return "clinic_consultation_click";
    case "equipment_quote":
      return "equipment_quote_start";
    case "investor_materials":
      return "investor_materials_requested";
    default:
      return null;
  }
}

/** Brand a registry action points at, for the brand parameter. */
export function brandForAction(action: ActionKey): BrandKey | undefined {
  switch (action) {
    case "shop_lifesupply":
    case "browse_clinic_supplies":
      return "lifesupply";
    case "shop_wellmart":
      return "wellmart";
    case "shop_clinics":
    case "view_clinic_projects":
    case "plan_clinic":
    case "equipment_quote":
      return "clinics";
    case "shop_balkowitsch":
      return "balkowitsch";
    default:
      return undefined;
  }
}

const SAFE_VALUE = /^[a-z0-9_-]{1,40}$/;

/**
 * Data attributes for a measurable element. Parameters not allowlisted for
 * the event are dropped; a value that is not a short identifier is dropped;
 * a server-only event never produces browser markup.
 */
export function measurementAttributes(
  event: MeasurementEvent,
  params: MeasurementParams = {},
): Record<string, string> {
  const definition = MEASUREMENT_EVENTS[event];
  if (definition.source !== "browser") return {};
  const attributes: Record<string, string> = { "data-measure": event };
  const allowed = definition.params as readonly string[];
  if (allowed.includes("brand") && params.brand && SAFE_VALUE.test(params.brand)) {
    attributes["data-measure-brand"] = params.brand;
  }
  if (allowed.includes("intent") && params.intent && SAFE_VALUE.test(params.intent)) {
    attributes["data-measure-intent"] = params.intent;
  }
  if (
    allowed.includes("documentType") &&
    params.documentType &&
    SAFE_VALUE.test(params.documentType)
  ) {
    attributes["data-measure-document-type"] = params.documentType;
  }
  return attributes;
}

/** Attributes for a registry action, or none when the action is not measurable. */
export function actionMeasurement(action: ActionKey): Record<string, string> {
  const event = eventForAction(action);
  if (!event) return {};
  return measurementAttributes(event, { brand: brandForAction(action) });
}
