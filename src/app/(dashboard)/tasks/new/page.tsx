import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { listAssignableUsers } from "@/server/services/tasks";
import { requirePermission } from "@/server/permissions";

import { NewTaskForm } from "./new-task-form";

export const metadata = { title: "New task" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    relatedEntityType?: string;
    relatedEntityId?: string;
    title?: string;
  }>;
};

export default async function NewTaskPage({ searchParams }: Props) {
  await requirePermission(PERMISSIONS.TASKS_CREATE);
  const params = await searchParams;
  const assignableUsers = await listAssignableUsers();

  return (
    <div>
      <PageHeader
        title="New task"
        description="Create a task and link it to an order, customer, product, or other entity."
        breadcrumb={
          <Link href="/tasks" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Tasks
          </Link>
        }
      />
      <div className="p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Task details</CardTitle>
          </CardHeader>
          <CardContent>
            <NewTaskForm
              assignableUsers={assignableUsers}
              defaults={{
                title: params.title ?? "",
                relatedEntityType: params.relatedEntityType ?? "",
                relatedEntityId: params.relatedEntityId ?? "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
