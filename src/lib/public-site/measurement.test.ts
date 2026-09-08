import { describe, expect, it } from "vitest";

import { ACTIONS, type ActionKey } from "./actions";
import {
  DEFAULT_CONSENT,
  MEASUREMENT_EVENTS,
  actionMeasurement,
  brandForAction,
  eventForAction,
  measurementAttributes,
} from "./measurement";

describe("measurement taxonomy", () => {
  it("defines exactly the six events from the guide, one of them server-only", () => {
    expect(Object.keys(MEASUREMENT_EVENTS).sort()).toEqual([
      "brand_destination_click",
      "clinic_consultation_click",
      "equipment_quote_start",
      "inquiry_submitted",
      "investor_materials_requested",
      "public_document_download",
    ]);
    expect(MEASUREMENT_EVENTS.inquiry_submitted.source).toBe("server");
    for (const [name, definition] of Object.entries(MEASUREMENT_EVENTS)) {
      for (const param of definition.params) {
        expect(["brand", "intent", "documentType"], `${name}.${param}`).toContain(param);
      }
    }
  });

  it("denies analytics by default and grants only what the site already does", () => {
    expect(DEFAULT_CONSENT).toEqual({ necessary: "granted", analytics: "denied" });
  });

  it("emits only allowlisted, identifier-shaped parameters and no markup for the server event", () => {
    expect(measurementAttributes("brand_destination_click", { brand: "wellmart" })).toEqual({
      "data-measure": "brand_destination_click",
      "data-measure-brand": "wellmart",
    });
    expect(measurementAttributes("brand_destination_click", { intent: "general" })).toEqual({
      "data-measure": "brand_destination_click",
    });
    expect(
      measurementAttributes("public_document_download", { documentType: "annual report?x=1" }),
    ).toEqual({ "data-measure": "public_document_download" });
    expect(measurementAttributes("inquiry_submitted", { intent: "general" })).toEqual({});
  });

  it("maps every outbound store, consultation, quote, and investor-materials action, and nothing internal", () => {
    expect(eventForAction("shop_lifesupply")).toBe("brand_destination_click");
    expect(eventForAction("plan_clinic")).toBe("clinic_consultation_click");
    expect(eventForAction("equipment_quote")).toBe("equipment_quote_start");
    expect(eventForAction("investor_materials")).toBe("investor_materials_requested");
    expect(brandForAction("plan_clinic")).toBe("clinics");
    for (const key of Object.keys(ACTIONS) as ActionKey[]) {
      const record = ACTIONS[key];
      if (record.destination.kind === "internal") {
        expect(eventForAction(key), key).toBeNull();
        expect(actionMeasurement(key), key).toEqual({});
      }
      if (record.destination.kind === "external") {
        expect(eventForAction(key), key).not.toBeNull();
      }
    }
    expect(actionMeasurement("shop_balkowitsch")).toEqual({
      "data-measure": "brand_destination_click",
      "data-measure-brand": "balkowitsch",
    });
  });
});
