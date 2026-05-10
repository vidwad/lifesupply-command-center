import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, Plus } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { getTaskCounts, listTasks, type TaskListView } from "@/server/services/tasks";
import { requirePermission, userHasPermission } from "@/server/permissions";

export const metadata = { title: "Tasks & Workflows" };
export const dynamic = "force-dynamic";

const VALID_VIEWS: TaskListView[] = [
  "all",
  "my",
  "overdue",
  "high_priority",
  "awaiting_approval",
  "completed",
];

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
  urgent: "destructive",
  high: "warning",
  medium: "secondary",
  low: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  blocked: "Blocked",
  awaiting_approval: "Awaiting approval",
  completed: "Completed",
  cancelled: "Cancelled",
};

type SearchParams = { view?: string; q?: string };

export default async function TasksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requirePermission(PERMISSIONS.TASKS_VIEW);
  const params = await searchParams;

  const view = (VALID_VIEWS as string[]).includes(params.view ?? "")
    ? (params.view as TaskListView)
    : "all";

  const [tasks, counts] = await Promise.all([
    listTasks({ view, search: params.q?.trim() || undefined, currentUserId: user.id }),
    getTaskCounts(user.id),
  ]);

  const canCreate = userHasPermission(user, PERMISSIONS.TASKS_CREATE);

  const tabs: { key: TaskListView; label: string; count: number }[] = [
    { key: "all", label: "All active", count: counts.active },
    { key: "my", label: "My tasks", count: counts.mine },
    { key: "overdue", label: "Overdue", count: counts.overdue },
    { key: "high_priority", label: "High priority", count: counts.highPriority },
    { key: "awaiting_approval", label: "Awaiting approval", count: counts.awaitingApproval },
    { key: "completed", label: "Completed", count: 0 },
  ];

  return (
    <div>
      <PageHeader
        title="Tasks & Workflows"
        description="Convert insights and exceptions into action and accountability."
        breadcrumb={`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"} in ${tabs.find((t) => t.key === view)?.label.toLowerCase()}`}
        actions={
          canCreate && (
            <Link href="/tasks/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> New task
              </Button>
            </Link>
          )
        }
      />

      <div className="space-y-4 p-6">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => {
            const isActive = view === t.key;
            const next = new URLSearchParams();
            if (t.key !== "all") next.set("view", t.key);
            if (params.q) next.set("q", params.q);
            const href = `/tasks${next.toString() ? `?${next}` : ""}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {t.label}
                {t.count > 0 && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] tabular-nums",
                      isActive ? "bg-primary-foreground/20" : "bg-muted",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </Link>
            );
          })}
          <form action="/tasks" className="ml-auto flex items-center gap-2">
            {view !== "all" && <input type="hidden" name="view" value={view} />}
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search tasks…"
              className="h-9 w-64 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={view === "completed" ? CheckCircle2 : ClipboardList}
            title={
              view === "overdue"
                ? "No overdue tasks"
                : view === "completed"
                  ? "No completed tasks yet"
                  : "No tasks match this filter"
            }
            description={
              view === "overdue"
                ? "All caught up — nothing past its due date."
                : "Create a new task or adjust the filter."
            }
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Title</TH>
                <TH>Priority</TH>
                <TH>Status</TH>
                <TH>Assigned</TH>
                <TH>Due</TH>
                <TH>Related</TH>
              </tr>
            </THead>
            <TBody>
              {tasks.map((t) => (
                <TR key={t.id}>
                  <TD>
                    <Link href={`/tasks/${t.id}`} className="font-medium hover:underline">
                      {t.title}
                    </Link>
                    {t.description && (
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {t.description}
                      </div>
                    )}
                  </TD>
                  <TD>
                    <Badge variant={PRIORITY_VARIANT[t.priority] ?? "secondary"}>
                      {t.priority}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge variant="outline">{STATUS_LABEL[t.status] ?? t.status}</Badge>
                  </TD>
                  <TD className="text-muted-foreground">
                    {t.assignedTo?.name ?? t.assignedTo?.email ?? "Unassigned"}
                  </TD>
                  <TD>
                    {t.dueDate ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs",
                          t.isOverdue ? "font-medium text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {t.isOverdue ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <CalendarDays className="h-3 w-3" />
                        )}
                        {formatDate(t.dueDate)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {t.relatedEntityType ? `${t.relatedEntityType}` : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}
