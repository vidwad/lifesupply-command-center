import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";

import { CapitalRaiseCreateForm } from "./create-form";

export const metadata = { title: "New capital raise" };

export default async function NewCapitalRaisePage() {
  await requirePermission(PERMISSIONS.INVESTORS_UPDATE);
  return (
    <div>
      <PageHeader
        title="New capital raise"
        description="Open a new financing round so commitments can be tracked against a target."
        breadcrumb={
          <Link
            href="/investors/capital-raises"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Capital raises
          </Link>
        }
      />
      <div className="mx-auto max-w-3xl p-6">
        <CapitalRaiseCreateForm />
      </div>
    </div>
  );
}
