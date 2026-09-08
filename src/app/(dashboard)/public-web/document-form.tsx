"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createDocumentAction, saveDocumentAction, type PublicWebActionState } from "./actions";

export type DocumentFormValues = {
  id?: string;
  expectedUpdatedAt?: string;
  title: string;
  documentType: string;
  periodLabel: string;
  publicUrl: string;
  disclosureText: string;
  sourceReference: string;
};

const textarea =
  "flex min-h-[6rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const select =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function DocumentForm({
  values,
  editable,
  documentTypes,
  allowedHosts,
}: {
  values: DocumentFormValues;
  editable: boolean;
  documentTypes: readonly string[];
  allowedHosts: readonly string[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<PublicWebActionState, FormData>(
    async (prev, formData) => {
      const result = values.id
        ? await saveDocumentAction(prev, formData)
        : await createDocumentAction(prev, formData);
      if (result && "ok" in result && result.id && !values.id) {
        router.push(`/public-web/documents/${result.id}`);
      } else if (result && "ok" in result) {
        router.refresh();
      }
      return result;
    },
    undefined,
  );
  const issues = state && "error" in state ? state.issues : undefined;
  const issueFor = (name: string) => issues?.find((entry) => entry.path === name)?.message;

  return (
    <form action={formAction} className="space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {values.expectedUpdatedAt && (
        <input type="hidden" name="expectedUpdatedAt" value={values.expectedUpdatedAt} />
      )}
      <fieldset disabled={!editable || pending} className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={values.title} required maxLength={200} />
          {issueFor("title") && <p className="text-xs text-destructive">{issueFor("title")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="documentType">Document type</Label>
          <select
            id="documentType"
            name="documentType"
            defaultValue={values.documentType}
            className={select}
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="periodLabel">Period or date, as stated on the document</Label>
          <Input id="periodLabel" name="periodLabel" defaultValue={values.periodLabel} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="publicUrl">Approved file location (https)</Label>
          <Input id="publicUrl" name="publicUrl" type="url" defaultValue={values.publicUrl} />
          <p className="text-xs text-muted-foreground">
            {allowedHosts.length === 0
              ? "No document host is approved yet (object storage is undecided, DEC-03). Leave blank; the record publishes as metadata and reads “on request”."
              : `Only these hosts are accepted: ${allowedHosts.join(", ")}.`}
          </p>
          {issueFor("publicUrl") && (
            <p className="text-xs text-destructive">{issueFor("publicUrl")}</p>
          )}
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="disclosureText">Disclosure text shown beside the document</Label>
          <textarea
            id="disclosureText"
            name="disclosureText"
            defaultValue={values.disclosureText}
            className={textarea}
            maxLength={2000}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="sourceReference">Source reference (internal)</Label>
          <Input
            id="sourceReference"
            name="sourceReference"
            defaultValue={values.sourceReference}
          />
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!editable || pending}>
          {pending ? "Saving…" : values.id ? "Save record" : "Create record"}
        </Button>
        {state && "error" in state && (
          <span className="text-sm text-destructive" role="alert">
            {state.error}
          </span>
        )}
        {state && "ok" in state && (
          <span className="text-sm text-success" role="status">
            {state.ok}
          </span>
        )}
      </div>
    </form>
  );
}
