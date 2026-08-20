"use client";

import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { createProjectAction, type ProductStudioActionState } from "../actions";

export function ProductStudioIntakeForm(props: {
  productId?: string;
  defaultTitle?: string;
  defaultDescription?: string;
}) {
  const [state, formAction, pending] = useActionState<ProductStudioActionState, FormData>(
    createProjectAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      {props.productId ? <input type="hidden" name="productId" value={props.productId} /> : null}
      <label className="block space-y-1.5 text-sm font-medium">
        Working product title
        <Input
          name="title"
          defaultValue={props.defaultTitle}
          minLength={3}
          maxLength={240}
          required
          placeholder="Brand, exact model, and product type"
        />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Short product description
        <textarea
          name="shortDescription"
          defaultValue={props.defaultDescription}
          minLength={10}
          maxLength={4000}
          rows={5}
          required
          placeholder="Known model identifiers, included accessories, and visible condition. Do not guess."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        Authoritative reference photos (1–4)
        <Input
          name="referenceImages"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          className="h-auto py-2"
        />
        <span className="block text-xs font-normal text-muted-foreground">
          JPEG, PNG, or WebP; maximum 8 MiB each. These—not retailer images—lock product identity
          and condition.
        </span>
      </label>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Create review workspace
      </Button>
    </form>
  );
}
