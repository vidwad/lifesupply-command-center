import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { FAMILIES, type PublicFamily } from "@/server/public-web/families";

import { ContentForm } from "../../content-form";

export const dynamic = "force-dynamic";

export default async function NewPublicContentPage({
  searchParams,
}: {
  searchParams: Promise<{ family?: string }>;
}) {
  await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
  const { family: requested } = await searchParams;
  const family: PublicFamily = requested === "resource" ? "resource" : "news";
  return (
    <div>
      <PageHeader
        title={`New ${family === "news" ? "news item" : "resource"}`}
        description={`Creates a draft in the ${FAMILIES[family].label} family. Nothing is public until an approver publishes it.`}
        breadcrumb={
          <Link
            href="/public-web/content"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Public content
          </Link>
        }
      />
      <div className="max-w-4xl p-6">
        <ContentForm
          editable
          values={{
            family,
            slug: "",
            title: "",
            summary: "",
            sourceReference: "",
            effectiveAt: "",
            expiresAt: "",
            body: "",
            date: "",
            sourceLabel: "",
            sourceHref: "",
            author: "",
            reviewer: "",
            published: "",
            reviewed: "",
            action: "general_inquiry",
          }}
        />
      </div>
    </div>
  );
}
