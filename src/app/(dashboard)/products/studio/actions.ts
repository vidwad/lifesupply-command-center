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
} from "@/server/services/product-studio";

export type ProductStudioActionState = { error?: string } | undefined;

function actionError(error: unknown, fallback: string): ProductStudioActionState {
  if (error instanceof ProductStudioInputError) return { error: error.message };
  return { error: error instanceof Error ? error.message : fallback };
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
    return actionError(error, "Could not create the Product Studio project.");
  }
  redirect(`/products/studio/${projectId}`);
}

export async function queueResearchAction(formData: FormData): Promise<void> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  await queueProductStudioResearch({ projectId, actorUserId: user.id });
  revalidatePath(`/products/studio/${projectId}`);
}

export async function queueGenerationAction(formData: FormData): Promise<void> {
  const user = await requireStudioUser();
  const projectId = String(formData.get("projectId") ?? "");
  const slot = Number(formData.get("slot"));
  await queueProductStudioGeneration({ projectId, slot, actorUserId: user.id });
  revalidatePath(`/products/studio/${projectId}`);
}

export async function reviewAssetAction(formData: FormData): Promise<void> {
  const user = await requireStudioUser();
  const assetId = String(formData.get("assetId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const rawDecision = String(formData.get("decision") ?? "");
  if (rawDecision !== "approved" && rawDecision !== "rejected") {
    throw new ProductStudioInputError("Choose approve or reject.");
  }
  await reviewProductStudioAsset({ assetId, actorUserId: user.id, decision: rawDecision });
  revalidatePath(`/products/studio/${projectId}`);
}
