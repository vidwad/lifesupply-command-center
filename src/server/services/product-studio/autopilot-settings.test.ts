import { describe, expect, it } from "vitest";

import {
  AutopilotSettingsError,
  autopilotSettingsFromForm,
  DEFAULT_AUTOPILOT_SETTINGS,
  describeAutopilotSettings,
  estimateMaxImages,
  MAX_RUN_PRODUCTS,
  parseAutopilotSettings,
  publishesToStore,
  publishThreshold,
} from "./autopilot-settings";
import { MAX_BATCH_SIZE } from "./bulk";

describe("unattended run settings", () => {
  it("the defaults are valid and match the owner's brief", () => {
    const parsed = parseAutopilotSettings(DEFAULT_AUTOPILOT_SETTINGS);
    expect(parsed.minImageScore).toBe(0.8);
    expect(parsed.imagesPerProduct).toBe(4);
    expect(parsed.publishMode).toBe("none");
    expect(MAX_RUN_PRODUCTS).toBe(MAX_BATCH_SIZE);
  });

  it("reads the form with scores as whole percentages and the checkbox as a flag", () => {
    const form = new FormData();
    form.set("minImageScore", "85");
    form.set("minIdentityConfidence", "90");
    form.set("imagesPerProduct", "2");
    form.set("maxRegenerationsPerSlot", "1");
    form.set("maxProducts", "5");
    form.set("maxImagesTotal", "20");
    form.set("parallelProducts", "3");
    form.set("stopAfterConsecutiveFailures", "2");
    form.set("publishMode", "none");
    const settings = autopilotSettingsFromForm(form);
    expect(settings.minImageScore).toBeCloseTo(0.85);
    expect(settings.minIdentityConfidence).toBeCloseTo(0.9);
    expect(settings.imagesPerProduct).toBe(2);
    expect(settings.parallelProducts).toBe(3);
    expect(settings.createTask).toBe(false);
    form.set("createTask", "1");
    expect(autopilotSettingsFromForm(form).createTask).toBe(true);
  });

  it("falls back to the defaults for empty fields and names the first bad one", () => {
    const empty = new FormData();
    // A checkbox left unticked arrives absent, so createTask reads false.
    expect(autopilotSettingsFromForm(empty)).toEqual({
      ...DEFAULT_AUTOPILOT_SETTINGS,
      createTask: false,
    });
    const bad = new FormData();
    bad.set("imagesPerProduct", "9");
    expect(() => autopilotSettingsFromForm(bad)).toThrow(AutopilotSettingsError);
    expect(() => autopilotSettingsFromForm(bad)).toThrow(/imagesPerProduct/);
    const text = new FormData();
    text.set("maxProducts", "ten");
    expect(() => autopilotSettingsFromForm(text)).toThrow(/enter a number/);
  });

  it("accepts the four publish modes and the two description modes, and nothing else", () => {
    for (const publishMode of ["none", "images", "images_and_description", "all"] as const) {
      expect(
        parseAutopilotSettings({ ...DEFAULT_AUTOPILOT_SETTINGS, publishMode }).publishMode,
      ).toBe(publishMode);
      expect(publishesToStore({ publishMode })).toBe(publishMode !== "none");
    }
    expect(() =>
      parseAutopilotSettings({ ...DEFAULT_AUTOPILOT_SETTINGS, publishMode: "everything" }),
    ).toThrow(/publishMode/);
    expect(() =>
      parseAutopilotSettings({ ...DEFAULT_AUTOPILOT_SETTINGS, descriptionMode: "always" }),
    ).toThrow(/descriptionMode/);
    const form = new FormData();
    form.set("publishMode", "all");
    form.set("descriptionMode", "fill_empty");
    expect(autopilotSettingsFromForm(form)).toMatchObject({
      publishMode: "all",
      descriptionMode: "fill_empty",
    });
  });

  it("publishes a product short of images only from the run's minimum, never above what it asks for", () => {
    // The default is every image, so a run behaves as before unless lowered.
    expect(DEFAULT_AUTOPILOT_SETTINGS.minApprovedImagesToPublish).toBe(4);
    expect(publishThreshold(DEFAULT_AUTOPILOT_SETTINGS)).toBe(4);
    // Runs frozen before the setting existed parse to the old behaviour.
    const { minApprovedImagesToPublish: _omitted, ...frozen } = DEFAULT_AUTOPILOT_SETTINGS;
    expect(parseAutopilotSettings(frozen).minApprovedImagesToPublish).toBe(4);
    expect(publishThreshold({ minApprovedImagesToPublish: 4, imagesPerProduct: 2 })).toBe(2);
    expect(publishThreshold({ minApprovedImagesToPublish: 0, imagesPerProduct: 4 })).toBe(0);
    const form = new FormData();
    form.set("minApprovedImagesToPublish", "2");
    expect(autopilotSettingsFromForm(form).minApprovedImagesToPublish).toBe(2);
    form.set("minApprovedImagesToPublish", "5");
    expect(() => autopilotSettingsFromForm(form)).toThrow(/minApprovedImagesToPublish/);
    const lowered = describeAutopilotSettings({
      ...DEFAULT_AUTOPILOT_SETTINGS,
      publishMode: "images",
      minApprovedImagesToPublish: 2,
    }).join(" ");
    expect(lowered).toContain(
      "at least 2 of a product's 4 images are approved, even if the rest failed",
    );
    const none = describeAutopilotSettings({
      ...DEFAULT_AUTOPILOT_SETTINGS,
      publishMode: "images_and_description",
      minApprovedImagesToPublish: 0,
    }).join(" ");
    expect(none).toContain("whether or not any was approved");
  });

  it("estimates the worst-case spend and caps it at the run ceiling", () => {
    const settings = { ...DEFAULT_AUTOPILOT_SETTINGS, maxImagesTotal: 80 };
    // 4 slots × (1 + 2 regenerations) = 12 per product.
    expect(estimateMaxImages(settings, 3)).toBe(36);
    expect(estimateMaxImages(settings, 10)).toBe(80);
  });

  it("describes every setting in one line each", () => {
    const lines = describeAutopilotSettings(DEFAULT_AUTOPILOT_SETTINGS);
    expect(lines).toHaveLength(10);
    expect(lines.join(" ")).toContain("80%");
    expect(lines.join(" ")).toContain("Nothing is sent to BigCommerce");
    const publishing = describeAutopilotSettings({
      ...DEFAULT_AUTOPILOT_SETTINGS,
      publishMode: "all",
      descriptionMode: "fill_empty",
    }).join(" ");
    expect(publishing).toContain("make the first composition the main image");
    expect(publishing).toContain("only where the store has none");
  });
});
