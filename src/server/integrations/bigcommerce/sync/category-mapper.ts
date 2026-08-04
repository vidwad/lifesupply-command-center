/**
 * Maps a BigCommerce /v3/catalog/categories payload into Prisma Category
 * upsert payloads (Phase 3C — docs/19). All fields are BC-owned. Hierarchy
 * (parentCategoryId) is resolved by the caller in a second pass, since BC's
 * parent_id points at another category whose Prisma id isn't known until it
 * has been upserted.
 */
import type { Prisma } from "@prisma/client";

export type BcCategory = {
  id: number;
  parent_id?: number | null;
  name?: string | null;
  sort_order?: number | null;
  is_visible?: boolean | null;
  custom_url?: { url?: string | null } | null;
};

export type CategoryUpsertPayloads = {
  create: Prisma.CategoryUncheckedCreateInput;
  update: Prisma.CategoryUncheckedUpdateInput;
};

export const SOURCE_SYSTEM = "bigcommerce";

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const s = v.trim();
  return s.length === 0 ? null : s;
}

export function mapBcCategoryToUpsert(
  bc: BcCategory,
  args: { storeId: string; parentCategoryId: string | null },
): CategoryUpsertPayloads {
  const bcOwned = {
    name: trimOrNull(bc.name) ?? "(unnamed category)",
    path: trimOrNull(bc.custom_url?.url),
    sortOrder: typeof bc.sort_order === "number" ? bc.sort_order : 0,
    isActive: bc.is_visible ?? true,
    parentCategoryId: args.parentCategoryId,
  };

  return {
    create: {
      sourceSystem: SOURCE_SYSTEM,
      sourceId: String(bc.id),
      storeId: args.storeId,
      ...bcOwned,
    },
    update: { ...bcOwned },
  };
}
