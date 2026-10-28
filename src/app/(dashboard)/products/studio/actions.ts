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
  recompileProductStudioPrompts,
} from "@/server/services/product-studio";
import {
  createProductStudioBatch,
  runFormHrefForBatch,
  studioHrefForBatch,
} from "@/server/services/product-studio/bulk";
import {
  reformatProductStudioDescription,
  updateProductStudioLongDescription,
} from "@/server/services/product-studio/description";
import {
  queueCompetitorImageSearch,
  selectCompetitorImage,
} from "@/server/services/product-studio/competitor-images";
import { linkProjectToProduct } from "@/server/services/product-studio/link";
import { updateSourcePhotos } from "@/server/services/product-studio/source-photos";

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
      revise: formData.get("revise") === "1",
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

/** Links a standalone project to a catalogue product; spends nothing. */
export async function linkProductAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  try {
    await linkProjectToProduct({ projectId, productId, actorUserId: user.id });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  redirect(`/products/studio/${projectId}`);
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

/**
 * Opens the selected products in Product Studio as one batch (2026-10-26).
 * Creation only: no research or generation is queued by this action.
 */
export async function bulkCreateProjectsAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const productIds = formData
    .getAll("productId")
    .filter((value): value is string => typeof value === "string");
  let batch: Awaited<ReturnType<typeof createProductStudioBatch>>;
  try {
    batch = await createProductStudioBatch({ actorUserId: user.id, productIds });
  } catch (error) {
    return actionError(error);
  }
  // Outside the try: redirect() signals by throwing and must never be caught.
  // One project opens directly; a product opened before rides along as `id=`.
  revalidatePath("/products/studio");
  redirect(studioHrefForBatch(batch));
}

/**
 * Opens the selected products as a batch and continues to the unattended-run
 * form for it (2026-10-27). Creation only, like the action above: the run
 * itself starts when that form is submitted. Super Admin only.
 */
export async function bulkAutopilotAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  await requirePermission(PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE);
  const productIds = formData
    .getAll("productId")
    .filter((value): value is string => typeof value === "string");
  let batch: Awaited<ReturnType<typeof createProductStudioBatch>>;
  try {
    batch = await createProductStudioBatch({ actorUserId: user.id, productIds });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/products/studio");
  // Projects the products already had ride along as `id=`; see runFormHrefForBatch.
  redirect(runFormHrefForBatch(batch));
}

export async function updateSourcePhotosAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  const files = formData
    .getAll("referenceImages")
    .filter((value): value is File => value instanceof File && value.size > 0);
  try {
    await updateSourcePhotos({
      projectId,
      actorUserId: user.id,
      files,
      mode: formData.get("mode") === "replace" ? "replace" : "add",
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

/** Queues the seller-image search for a project with no photograph (2026-10-28). */
export async function queueImageSearchAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await queueCompetitorImageSearch({ projectId, actorUserId: user.id });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

/** Makes a found seller image the project's authoritative photograph. */
export async function selectSellerImageAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  const candidateId = String(formData.get("candidateId") ?? "");
  try {
    await selectCompetitorImage({ projectId, candidateId, actorUserId: user.id });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

export async function reformatDescriptionAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await reformatProductStudioDescription({ projectId, actorUserId: user.id });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

export async function updateDescriptionAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await updateProductStudioLongDescription({
      projectId,
      actorUserId: user.id,
      longDescription: String(formData.get("longDescription") ?? ""),
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}

export async function recompilePromptsAction(
  _previous: ProductStudioActionState,
  formData: FormData,
): Promise<ProductStudioActionState> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  try {
    await recompileProductStudioPrompts({ projectId, actorUserId: user.id });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(`/products/studio/${projectId}`);
  return undefined;
}
