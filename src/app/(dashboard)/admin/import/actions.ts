"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import {
  importBigCommerceCustomers,
  importBigCommerceOrders,
  importBigCommerceProducts,
  type ImportSummary,
} from "@/server/services/imports/bigcommerce";
import { importQuickBooksPnl } from "@/server/services/imports/quickbooks";
import { requirePermission } from "@/server/permissions";

import type { PermissionKey } from "@/lib/permissions";

export type ImportActionState =
  | (ImportSummary & { ok: true })
  | { ok: false; error: string }
  | undefined;

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

async function readUpload(formData: FormData, name: string): Promise<string | null> {
  const file = formData.get(name);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB, max 25 MB).`);
  }
  return await file.text();
}

async function runImport(
  formData: FormData,
  permission: PermissionKey,
  fn: (text: string, actor: { id: string }, formData: FormData) => Promise<ImportSummary>,
): Promise<ImportActionState> {
  const actor = await requirePermission(permission);
  try {
    const text = await readUpload(formData, "file");
    if (!text) return { ok: false, error: "Choose a CSV file to upload." };
    const summary = await fn(text, { id: actor.id }, formData);
    revalidatePath("/admin/import");
    revalidatePath("/automation");
    return { ...summary, ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Import failed." };
  }
}

export async function importCustomersAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  return runImport(formData, PERMISSIONS.CUSTOMERS_UPDATE, async (csvText, actor, fd) => {
    const storeId = String(fd.get("storeId") ?? "");
    if (!storeId) throw new Error("Choose a store.");
    return importBigCommerceCustomers({ csvText, storeId, actor });
  });
}

export async function importProductsAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  return runImport(formData, PERMISSIONS.PRODUCTS_UPDATE, async (csvText, actor, fd) => {
    const storeId = String(fd.get("storeId") ?? "");
    if (!storeId) throw new Error("Choose a store.");
    return importBigCommerceProducts({ csvText, storeId, actor });
  });
}

export async function importOrdersAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  return runImport(formData, PERMISSIONS.ORDERS_UPDATE, async (csvText, actor, fd) => {
    const storeId = String(fd.get("storeId") ?? "");
    if (!storeId) throw new Error("Choose a store.");
    return importBigCommerceOrders({ csvText, storeId, actor });
  });
}

export async function importPnlAction(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  return runImport(formData, PERMISSIONS.FINANCIALS_IMPORT, async (csvText, actor) => {
    return importQuickBooksPnl({ csvText, actor });
  });
}
