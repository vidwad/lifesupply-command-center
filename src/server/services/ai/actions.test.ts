import { beforeEach, describe, expect, it, vi } from "vitest";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";

import { AiActionPermissionError } from "./errors";

// requireAiAction resolves the ai.actions flag through the feature-flag
// service, which hits the DB. Stub it so these tests stay pure and can drive
// the flag state directly.
const isFeatureOn = vi.hoisted(() => vi.fn());
vi.mock("@/server/services/feature-flags", () => ({ isFeatureOn }));

import { canPerformAiAction, requireAiAction } from "./actions";

const ACTION = "place_supplier_order";
const PERMISSION = PERMISSIONS.SUPPLIERS_APPROVE_ORDER_AUTOMATION;

function ctx(permissions: string[]) {
  return { user: { id: "u1", permissions }, permission: PERMISSION, action: ACTION };
}

describe("requireAiAction", () => {
  beforeEach(() => {
    isFeatureOn.mockReset();
  });

  it("throws when the user lacks the underlying permission — without consulting the flag", async () => {
    // The flag is ON, but the permission gate must reject first. We also assert
    // the flag is never queried, so a permissionless caller can't probe or
    // depend on flag state.
    isFeatureOn.mockResolvedValue(true);

    await expect(requireAiAction(ctx([]))).rejects.toBeInstanceOf(AiActionPermissionError);
    expect(isFeatureOn).not.toHaveBeenCalled();
  });

  it("throws when the user has the permission but the ai.actions flag is off", async () => {
    isFeatureOn.mockResolvedValue(false);

    await expect(requireAiAction(ctx([PERMISSION]))).rejects.toBeInstanceOf(
      AiActionPermissionError,
    );
    expect(isFeatureOn).toHaveBeenCalledWith(FEATURE_FLAGS.AI_ACTIONS);
  });

  it("resolves only when BOTH the permission is held and the flag is on", async () => {
    isFeatureOn.mockResolvedValue(true);

    await expect(requireAiAction(ctx([PERMISSION]))).resolves.toBeUndefined();
    expect(isFeatureOn).toHaveBeenCalledWith(FEATURE_FLAGS.AI_ACTIONS);
  });

  it("names the missing permission and action in the error", async () => {
    isFeatureOn.mockResolvedValue(true);

    await expect(requireAiAction(ctx([]))).rejects.toThrow(
      new RegExp(`${ACTION}.*${PERMISSION.replace(".", "\\.")}`),
    );
  });
});

describe("canPerformAiAction", () => {
  beforeEach(() => {
    isFeatureOn.mockReset();
  });

  it("returns { ok: true } when both gates pass", async () => {
    isFeatureOn.mockResolvedValue(true);
    await expect(canPerformAiAction(ctx([PERMISSION]))).resolves.toEqual({ ok: true });
  });

  it("returns { ok: false } with a reason when the permission is missing", async () => {
    isFeatureOn.mockResolvedValue(true);
    const result = await canPerformAiAction(ctx([]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain(PERMISSION);
  });

  it("returns { ok: false } with a reason when the flag is off", async () => {
    isFeatureOn.mockResolvedValue(false);
    const result = await canPerformAiAction(ctx([PERMISSION]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain(FEATURE_FLAGS.AI_ACTIONS);
  });
});
