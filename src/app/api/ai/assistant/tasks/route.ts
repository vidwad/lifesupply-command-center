/**
 * Creates a task the assistant drafted (docs/43 Stage 4, 2026-11-06). The
 * `draft_task` tool only proposes; the person reads the draft in the drawer
 * and presses Create, which posts here. The task is created by the existing
 * task service under the person's own user, with the assistant's answer as
 * its source, so the audit trail shows who confirmed what.
 */
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { normaliseTaskDraft } from "@/server/services/ai/assistant/task-draft";
import { createTask } from "@/server/services/tasks";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await requirePermission(PERMISSIONS.TASKS_CREATE);
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  const draft = normaliseTaskDraft(body.draft);
  if (!draft) return Response.json({ error: "A task title is required." }, { status: 400 });
  const aiOutputId = typeof body.aiOutputId === "string" ? body.aiOutputId.slice(0, 80) : null;
  try {
    const task = await createTask({
      title: draft.title,
      description: draft.description ?? null,
      priority: draft.priority,
      dueDate: draft.dueDate ?? null,
      relatedEntityType: draft.relatedEntityType ?? null,
      relatedEntityId: draft.relatedEntityId ?? null,
      createdById: user.id,
      sourceType: "ai_recommendation",
      sourceId: aiOutputId,
      metadata: { assistant: true, aiOutputId },
    });
    return Response.json(
      { id: task.id, href: `/tasks/${task.id}`, title: task.title },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "The task could not be created." },
      { status: 400 },
    );
  }
}
