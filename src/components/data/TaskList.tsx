import { AlertTriangle, CalendarDays, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  isOverdue: boolean;
  relatedEntityType: string | null;
};

type Props = { tasks: Task[]; title?: string };

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

export function TaskList({ tasks, title = "Priority tasks" }: Props) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No priority tasks"
            description="All caught up. New tasks will appear here as exceptions or AI recommendations land."
            className="border-0 bg-transparent"
          />
        ) : (
          <ul className="divide-y">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-3 py-3 first:pt-0">
                <Badge variant={PRIORITY_VARIANT[t.priority] ?? "secondary"} className="mt-0.5">
                  {t.priority}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{STATUS_LABEL[t.status] ?? t.status}</span>
                    {t.dueDate && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          t.isOverdue && "font-medium text-destructive",
                        )}
                      >
                        {t.isOverdue ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <CalendarDays className="h-3 w-3" />
                        )}
                        {t.isOverdue ? "Overdue " : "Due "}
                        {formatDate(t.dueDate)}
                      </span>
                    )}
                    {t.relatedEntityType && (
                      <span className="text-muted-foreground/80">on {t.relatedEntityType}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
