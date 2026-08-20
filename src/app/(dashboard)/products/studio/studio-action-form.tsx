"use client";

/**
 * Form wrapper that shows an action's validation message instead of crashing.
 *
 * Product Studio's service layer writes careful, specific refusals — "Generate
 * one composition at a time", "Research cannot be replaced after image
 * generation", "This project has work in progress". Those were thrown from
 * server actions with no handler, so each one rendered the generic error page
 * with a digest reference and the operator never saw the reason.
 *
 * useActionState keeps the message next to the control that produced it.
 */
import { useActionState } from "react";

import type { ProductStudioActionState } from "./actions";

export function StudioActionForm({
  action,
  children,
  className,
}: {
  action: (
    previous: ProductStudioActionState,
    formData: FormData,
  ) => Promise<ProductStudioActionState>;
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
