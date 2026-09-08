"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createContentAction, saveContentAction, type PublicWebActionState } from "./actions";

export type ContentFormValues = {
  id?: string;
  family: "news" | "resource";
  expectedUpdatedAt?: string;
  slug: string;
  title: string;
  summary: string;
  sourceReference: string;
  effectiveAt: string;
  expiresAt: string;
  body: string;
  // news
  date: string;
  sourceLabel: string;
  sourceHref: string;
  // resource
  author: string;
  reviewer: string;
  published: string;
  reviewed: string;
  action: string;
};

const textarea =
  "flex min-h-[8rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function Field({
  label,
  name,
  hint,
  issues,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  issues?: { path: string; message: string }[];
  children: React.ReactNode;
}) {
  const issue = issues?.find((entry) => entry.path === name || entry.path === `payload.${name}`);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {issue && (
        <p className="text-xs text-destructive" role="alert">
          {issue.message}
        </p>
      )}
    </div>
  );
}

/**
 * One form for both families. Every field is a plain named input so the
 * server action receives exactly what the editor typed; the concurrency
 * token travels as a hidden field and a stale save is refused server-side.
 */
export function ContentForm({
  values,
  editable,
}: {
  values: ContentFormValues;
  editable: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<PublicWebActionState, FormData>(
    async (prev, formData) => {
      const result = values.id
        ? await saveContentAction(prev, formData)
        : await createContentAction(prev, formData);
      if (result && "ok" in result && result.id && !values.id) {
        router.push(`/public-web/content/${result.id}`);
      } else if (result && "ok" in result) {
        router.refresh();
      }
      return result;
    },
    undefined,
  );
  const issues = state && "error" in state ? state.issues : undefined;
  const isNews = values.family === "news";

  return (
    <form action={formAction} className="space-y-6">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {values.expectedUpdatedAt && (
        <input type="hidden" name="expectedUpdatedAt" value={values.expectedUpdatedAt} />
      )}
      <input type="hidden" name="family" value={values.family} />
      <fieldset disabled={!editable || pending} className="grid gap-5 md:grid-cols-2">
        <Field label="Title" name="title" issues={issues}>
          <Input id="title" name="title" defaultValue={values.title} required maxLength={160} />
        </Field>
        <Field
          label="Slug"
          name="slug"
          hint="Lowercase words separated by hyphens; becomes the public address."
          issues={issues}
        >
          <Input
            id="slug"
            name="slug"
            defaultValue={values.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            label="Summary"
            name="summary"
            hint="One or two sentences shown in listings."
            issues={issues}
          >
            <textarea
              id="summary"
              name="summary"
              defaultValue={values.summary}
              className={textarea}
              required
              maxLength={600}
            />
          </Field>
        </div>
        {isNews ? (
          <>
            <Field
              label="Original publication date"
              name="date"
              hint="YYYY-MM-DD, preserved as the item's date."
              issues={issues}
            >
              <Input id="date" name="date" type="date" defaultValue={values.date} required />
            </Field>
            <Field
              label="Source reference"
              name="sourceReference"
              hint="Internal note on where the text came from."
              issues={issues}
            >
              <Input
                id="sourceReference"
                name="sourceReference"
                defaultValue={values.sourceReference}
              />
            </Field>
            <Field label="Public source label" name="source.label" issues={issues}>
              <Input
                id="sourceLabel"
                name="sourceLabel"
                defaultValue={values.sourceLabel}
                placeholder="Newswire"
              />
            </Field>
            <Field label="Public source link" name="source.href" hint="https only." issues={issues}>
              <Input
                id="sourceHref"
                name="sourceHref"
                type="url"
                defaultValue={values.sourceHref}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Author" name="author" issues={issues}>
              <Input id="author" name="author" defaultValue={values.author} required />
            </Field>
            <Field label="Reviewer" name="reviewer" issues={issues}>
              <Input id="reviewer" name="reviewer" defaultValue={values.reviewer} required />
            </Field>
            <Field label="Published date" name="published" issues={issues}>
              <Input
                id="published"
                name="published"
                type="date"
                defaultValue={values.published}
                required
              />
            </Field>
            <Field label="Reviewed date" name="reviewed" issues={issues}>
              <Input
                id="reviewed"
                name="reviewed"
                type="date"
                defaultValue={values.reviewed}
                required
              />
            </Field>
            <Field
              label="Next-step action key"
              name="action"
              hint="A key from the public action registry, e.g. discuss_program."
              issues={issues}
            >
              <Input id="action" name="action" defaultValue={values.action} required />
            </Field>
            <Field label="Source reference" name="sourceReference" issues={issues}>
              <Input
                id="sourceReference"
                name="sourceReference"
                defaultValue={values.sourceReference}
              />
            </Field>
          </>
        )}
        <div className="md:col-span-2">
          <Field
            label="Body"
            name="body"
            hint="Paragraphs separated by a blank line."
            issues={issues}
          >
            <textarea
              id="body"
              name="body"
              defaultValue={values.body}
              className={`${textarea} min-h-[16rem]`}
              required
            />
          </Field>
        </div>
        <Field
          label="Effective from"
          name="effectiveAt"
          hint="Optional. Blank publishes immediately."
          issues={issues}
        >
          <Input
            id="effectiveAt"
            name="effectiveAt"
            type="datetime-local"
            defaultValue={values.effectiveAt}
          />
        </Field>
        <Field
          label="Expires at"
          name="expiresAt"
          hint="Optional. The item disappears from the public site at this time."
          issues={issues}
        >
          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            defaultValue={values.expiresAt}
          />
        </Field>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!editable || pending}>
          {pending ? "Saving…" : values.id ? "Save draft" : "Create draft"}
        </Button>
        {!editable && (
          <span className="text-xs text-muted-foreground">
            Editing is locked after approval. Return the record to draft to change it.
          </span>
        )}
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
