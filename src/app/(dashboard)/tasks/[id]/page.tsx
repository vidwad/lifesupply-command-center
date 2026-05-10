import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate, formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getTaskById, listAssignableUsers } from "@/server/services/tasks";
import { requirePermission, userHasPermission } from "@/server/permissions";

import { assignAction, updateStatusAction } from "../actions";

export const dynamic = "force-dynamic";

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
  urgent: "destructive",
  high: "warning",
  medium: "secondary",
  low: "secondary",
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "awaiting_approval", label: "Awaiting approval" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const task = await getTaskById(id);
  return { title: task ? task.title : "Task" };
}

export default async function TaskDetailPage({ params }: Props) {
  const user = await requirePermission(PERMISSIONS.TASKS_VIEW);
  const { id } = await params;
  const task = await getTaskById(id);
  if (!task) notFound();

  const canUpdate = userHasPermission(user, PERMISSIONS.TASKS_UPDATE);
  const canAssign = userHasPermission(user, PERMISSIONS.TASKS_ASSIGN);
  const assignableUsers = canAssign ? await listAssignableUsers() : [];

  return (
    <div>
      <PageHeader
        title={task.title}
        description={`Created ${formatDateTime(task.createdAt)} by ${task.createdBy?.name ?? task.createdBy?.email ?? "system"}`}
        breadcrumb={
          <Link href="/tasks" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Tasks
          </Link>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={PRIORITY_VARIANT[task.priority] ?? "secondary"}>{task.priority}</Badge>
            <Badge variant="outline">{task.status.replace("_", " ")}</Badge>
            {task.isOverdue && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" /> Overdue
              </Badge>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {task.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {canUpdate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Update status</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={updateStatusAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="status"
                      className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      New status
                    </label>
                    <select
                      id="status"
                      name="status"
                      defaultValue={task.status}
                      className="h-9 min-w-[180px] rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" size="sm">
                    Save
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {canAssign && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assign</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={assignAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="assignedToId"
                      className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      Assignee
                    </label>
                    <select
                      id="assignedToId"
                      name="assignedToId"
                      defaultValue={task.assignedToId ?? ""}
                      className="h-9 min-w-[220px] rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">— Unassigned —</option>
                      {assignableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name ?? u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" size="sm" variant="secondary">
                    Save
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4" /> Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Priority" value={task.priority} />
                <Row label="Status" value={task.status.replace("_", " ")} />
                <Row label="Due date" value={task.dueDate ? formatDate(task.dueDate) : "—"} />
                {task.completedAt && <Row label="Completed" value={formatDate(task.completedAt)} />}
                <Row
                  label="Assigned to"
                  value={task.assignedTo?.name ?? task.assignedTo?.email ?? "Unassigned"}
                />
                <Row
                  label="Created by"
                  value={task.createdBy?.name ?? task.createdBy?.email ?? "system"}
                />
                <Row label="Source" value={task.sourceType ?? "manual"} />
              </dl>
            </CardContent>
          </Card>

          {task.relatedEntityType && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Related</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">{task.relatedEntityType}</p>
                {task.relatedEntityHref && task.relatedEntityLabel ? (
                  <Link
                    href={task.relatedEntityHref}
                    className="font-medium text-primary hover:underline"
                  >
                    {task.relatedEntityLabel}
                  </Link>
                ) : (
                  <p className="text-muted-foreground">{task.relatedEntityLabel ?? "—"}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
