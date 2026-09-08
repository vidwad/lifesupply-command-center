import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/server/permissions";
import { DOCUMENT_TYPES, allowedDocumentHosts } from "@/server/public-web/families";

import { DocumentForm } from "../../document-form";

export const dynamic = "force-dynamic";

export default async function NewPublicDocumentPage() {
  await requirePermission(PERMISSIONS.PUBLIC_WEB_EDIT);
  return (
    <div>
      <PageHeader
        title="New document record"
        description="Metadata only. Enter public documents here; restricted or confidential material stays out of this system and is handled by request."
        breadcrumb={
          <Link
            href="/public-web/documents"
            className="inline-flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Public documents
          </Link>
        }
      />
      <div className="max-w-3xl p-6">
        <DocumentForm
          editable
          documentTypes={DOCUMENT_TYPES}
          allowedHosts={allowedDocumentHosts()}
          values={{
            title: "",
            documentType: "other",
            periodLabel: "",
            publicUrl: "",
            disclosureText: "",
            sourceReference: "",
          }}
        />
      </div>
    </div>
  );
}
