"use server";

import { revalidatePath } from "next/cache";

import { PERMISSIONS } from "@/lib/permissions";
import { importBudgetCsv, type ImportBudgetResult } from "@/server/services/finance/budgets";
import { requirePermission } from "@/server/permissions";

export type BudgetImportState =
  | ({ ok: true } & ImportBudgetResult)
  | { ok: false; error: string }
  | undefined;

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function importBudgetAction(
  _prev: BudgetImportState,
  formData: FormData,
): Promise<BudgetImportState> {
  const actor = await requirePermission(PERMISSIONS.FINANCIALS_MANAGE_ADJUSTMENTS);
  const name = String(formData.get("name") ?? "").trim();
  const year = Number(formData.get("year") ?? "");
  const divisionId = String(formData.get("divisionId") ?? "") || null;
  const file = formData.get("file");

  if (!name) return { ok: false, error: "Budget name is required." };
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { ok: false, error: "Year must be a valid integer." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a CSV file." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB, max 5 MB).`,
    };
  }

  try {
    const csvText = await file.text();
    const result = await importBudgetCsv({
      name,
      year,
      divisionId,
      csvText,
      actor: { id: actor.id },
    });
    revalidatePath("/financials/budgets");
    revalidatePath("/financials");
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Budget import failed." };
  }
}
