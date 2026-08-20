"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import {
  createProductStudioProject,
  ProductStudioInputError,
  queueProductStudioGeneration,
  queueProductStudioResearch,
  reviewProductStudioAsset,
  deleteProductStudioProject,
} from "@/server/services/product-studio";

export type ProductStudioActionState = { error?: string } | undefined;

/**
 * Turns an expected input failure into a message for the form.
 *
 * Only ProductStudioInputError is converted. Anything else — including Next's
 * redirect and notFound control-flow errors — is rethrown, so real faults still
 * reach the error boundary and the logs instead of being shown to the operator
 * as if they had typed something wrong.
 */
function actionError(error: unknown): ProductStudioActionState {
  if (error instanceof ProductStudioInputError) return { error: error.message };
  throw error;
}

async function requireStudioUser() {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  await requirePermission(PERMISSIONS.AI_USE);
  return user;
}

export async function createProjectAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const files = formData
    .getAll("referenceImages")
    .filter((value): value is File => value instanceof File && value.size > 0);
  let projectId: string;
  try {
    projectId = await createProductStudioProject({
      actorUserId: user.id,
      productId: String(formData.get("productId") ?? "").trim() || null,
      title: String(formData.get("title") ?? ""),
      shortDescription: String(formData.get("shortDescription") ?? ""),
      files,
    });
  } catch (error) {
    return actionError(error);
  }
  redirect(`/products/studio/${projectId}`);
}

export async function queueResearchAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await queueProductStudioResearch({ projectId, actorUserId: user.id });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

export async function queueGenerationAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  const slot = Number(formData.get("slot"));
  const operatorInstructions = formData.get("operatorInstructions");
  try {
    await queueProductStudioGeneration({
      projectId,
      slot,
      actorUserId: user.id,
      operatorInstructions: typeof operatorInstructions === "string" ? operatorInstructions : null,
      autoContinue: formData.get("autoContinue") === "1",
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

export async function reviewAssetAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const assetId = String(formData.get("assetId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const rawDecision = String(formData.get("decision") ?? "");
  try {
    if (rawDecision !== "approved" && rawDecision !== "rejected") {
      throw new ProductStudioInputError("Choose approve or reject.");
    }
    await reviewProductStudioAsset({ assetId, actorUserId: user.id, decision: rawDecision });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

export async function deleteProjectAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await deleteProductStudioProject({ projectId, actorUserId: user.id });
  } catch (error) {
    return actionError(error);
  }
  // Outside the try: redirect() signals by throwing and must never be caught.
  revalidatePath("/products/studio");
  redirect("/products/studio");
}
