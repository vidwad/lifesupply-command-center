"use server";

/**
 * Server actions for publishing Product Studio content to BigCommerce.
 *
 * Separate from actions.ts on purpose: these are the only actions that import
 * the publish service, which two imports down holds the BigCommerce write
 * client. The Studio's review actions and the project page never load it.
 *
 * Every action requires products.approve_bigcommerce_update at this boundary,
 * and the service re-asserts it from the permissions passed in.
 */
import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { ProductStudioInputError } from "@/server/services/product-studio";
import {
  publishProductStudioProject,
  setAssetUploadMark,
  setDescriptionUploadMark,
  setMainImage,
  type PublishItemResult,
} from "@/server/services/product-studio/publish";

export type PublishActionState =
  | { error?: string; ok?: string; items?: PublishItemResult[] }
  | undefined;

function actionError(error: unknown): PublishActionState {
  if (error instanceof ProductStudioInputError) return { error: error.message };
  throw error;
}

async function requirePublisher() {
  return requirePermission(PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE);
}

export async function setAssetUploadMarkAction(
  _previous: PublishActionState,
  formData: FormData,
): Promise<PublishActionState> {
  const user = await requirePublisher();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await setAssetUploadMark({
      assetId: String(formData.get("assetId") ?? ""),
      actorUserId: user.id,
      actorPermissions: user.permissions,
      marked: formData.get("marked") === "1",
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

export async function setMainImageAction(
  _previous: PublishActionState,
  formData: FormData,
): Promise<PublishActionState> {
  const user = await requirePublisher();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await setMainImage({
      projectId,
      assetId: String(formData.get("mainImageAssetId") ?? "").trim() || null,
      actorUserId: user.id,
      actorPermissions: user.permissions,
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return { ok: "Main image choice saved. It is applied on the next publish." };
}

export async function setDescriptionUploadMarkAction(
  _previous: PublishActionState,
  formData: FormData,
): Promise<PublishActionState> {
  const user = await requirePublisher();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await setDescriptionUploadMark({
      projectId,
      actorUserId: user.id,
      actorPermissions: user.permissions,
      marked: formData.get("marked") === "1",
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

export async function publishProjectAction(
  _previous: PublishActionState,
  formData: FormData,
): Promise<PublishActionState> {
  const user = await requirePublisher();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    const result = await publishProductStudioProject({
      projectId,
      actorUserId: user.id,
      actorPermissions: user.permissions,
    });
    revalidatePath(`/products/studio/${projectId}`);
    return result.status === "succeeded"
      ? { ok: result.message, items: result.items }
      : { error: result.message, items: result.items };
  } catch (error) {
    return actionError(error);
  }
}
