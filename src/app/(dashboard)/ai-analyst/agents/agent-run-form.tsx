"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { runAgentAction, type AgentActionState } from "./actions";

type ParamSpec = { name: string; label: string; required: boolean; placeholder?: string };

export function AgentRunForm({
  agentKey,
  params,
  disabled,
}: {
  agentKey: string;
  params: ParamSpec[];
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<AgentActionState, FormData>(
    runAgentAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="agentKey" value={agentKey} />
      {params.map((p) => (
        <div key={p.name} className="space-y-1">
          <label
            htmlFor={`${agentKey}_${p.name}`}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {p.label}
            {p.required ? " *" : ""}
          </label>
          <input
            id={`${agentKey}_${p.name}`}
            name={`param_${p.name}`}
            required={p.required}
            placeholder={p.placeholder}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          />
        </div>
      ))}
      <Button type="submit" size="sm" disabled={pending || disabled}>
        {pending ? "Running…" : "Run agent"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
