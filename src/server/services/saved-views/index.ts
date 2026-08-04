/**
 * Per-user saved views for operations queues (Phase 8 — docs/19 §8).
 *
 * A saved view is just a named, sanitized set of query-string filters for a
 * dashboard page ("operations", "operations/exceptions", "orders", "tasks").
 * Applying one is a plain link — no bespoke state, no behavior change to the
 * underlying pages.
 */
import type { Prisma } from "@prisma/client";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

export const SAVED_VIEW_PAGES = ["operations", "operations/exceptions", "orders", "tasks"] as const;
export type SavedViewPage = (typeof SAVED_VIEW_PAGES)[number];

/** Bounded so a runaway client can't fill the table. */
export const MAX_VIEWS_PER_PAGE = 20;
export const MAX_NAME_LENGTH = 60;
const MAX_PARAM_KEY = 40;
const MAX_PARAM_VALUE = 200;
const MAX_PARAMS = 12;

export type SavedViewRow = {
  id: string;
  page: SavedViewPage;
  name: string;
  params: Record<string, string>;
};

export function isSavedViewPage(value: string): value is SavedViewPage {
  return (SAVED_VIEW_PAGES as readonly string[]).includes(value);
}

/** Keep only simple string params, bounded in count and length. Pure. */
export function sanitizeViewParams(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (Object.keys(out).length >= MAX_PARAMS) break;
    if (typeof value !== "string") continue;
    const k = key.trim().slice(0, MAX_PARAM_KEY);
    const v = value.trim().slice(0, MAX_PARAM_VALUE);
    if (!k || !v) continue;
    out[k] = v;
  }
  return out;
}

export function viewHref(view: SavedViewRow): string {
  const qs = new URLSearchParams(view.params).toString();
  return `/${view.page}${qs ? `?${qs}` : ""}`;
}

export async function listSavedViews(userId: string, page: SavedViewPage): Promise<SavedViewRow[]> {
  const rows = await prisma.savedView.findMany({
    where: { userId, page },
    orderBy: { name: "asc" },
    take: MAX_VIEWS_PER_PAGE,
  });
  return rows.map((r) => ({
    id: r.id,
    page: r.page as SavedViewPage,
    name: r.name,
    params: sanitizeViewParams((r.params as Record<string, unknown>) ?? {}),
  }));
}

export async function saveView(args: {
  userId: string;
  page: SavedViewPage;
  name: string;
  params: Record<string, unknown>;
}): Promise<SavedViewRow> {
  const name = args.name.trim().slice(0, MAX_NAME_LENGTH);
  if (!name) throw new Error("View name is required.");
  const params = sanitizeViewParams(args.params);

  const existingCount = await prisma.savedView.count({
    where: { userId: args.userId, page: args.page },
  });
  const existing = await prisma.savedView.findUnique({
    where: { userId_page_name: { userId: args.userId, page: args.page, name } },
  });
  if (!existing && existingCount >= MAX_VIEWS_PER_PAGE) {
    throw new Error(
      `Limit of ${MAX_VIEWS_PER_PAGE} saved views per page reached. Delete one first.`,
    );
  }

  const row = await prisma.savedView.upsert({
    where: { userId_page_name: { userId: args.userId, page: args.page, name } },
    create: {
      userId: args.userId,
      page: args.page,
      name,
      params: params as Prisma.InputJsonValue,
    },
    update: { params: params as Prisma.InputJsonValue },
  });
  await writeAudit({
    actorUserId: args.userId,
    action: existing ? "saved_view.updated" : "saved_view.created",
    entityType: "saved_view",
    entityId: row.id,
    afterData: { page: args.page, name, params },
  });
  return { id: row.id, page: args.page, name, params };
}

export async function deleteView(userId: string, id: string): Promise<void> {
  // Scoped delete — a user can only remove their own views.
  const row = await prisma.savedView.findFirst({ where: { id, userId } });
  if (!row) return;
  await prisma.savedView.delete({ where: { id: row.id } });
  await writeAudit({
    actorUserId: userId,
    action: "saved_view.deleted",
    entityType: "saved_view",
    entityId: row.id,
    afterData: { page: row.page, name: row.name },
  });
}
