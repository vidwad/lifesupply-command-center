"use server";

import { revalidatePath } from "next/cache";

import { deleteView, isSavedViewPage, saveView } from "@/server/services/saved-views";
import { requireUser } from "@/server/permissions";

export async function saveViewAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const page = String(formData.get("page") ?? "");
  const name = String(formData.get("name") ?? "");
  const rawParams = String(formData.get("params") ?? "{}");
  if (!isSavedViewPage(page) || !name.trim()) return;

  let params: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(rawParams);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      params = parsed as Record<string, unknown>;
    }
  } catch {
    // Malformed params → save the view with no filters rather than failing.
  }
  await saveView({ userId: user.id, page, name, params });
  revalidatePath(`/${page}`);
}

export async function deleteViewAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const page = String(formData.get("page") ?? "");
  if (!id) return;
  await deleteView(user.id, id);
  if (isSavedViewPage(page)) revalidatePath(`/${page}`);
}
