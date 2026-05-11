"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createRoleAction, type RoleActionState } from "./actions";

export function CreateRoleForm() {
  const [state, formAction, pending] = useActionState<RoleActionState, FormData>(
    createRoleAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-md border bg-card p-4">
      <h2 className="text-sm font-medium">Create custom role</h2>
      <div className="space-y-1.5">
        <Label htmlFor="role-name">Name</Label>
        <Input id="role-name" name="name" required autoComplete="off" placeholder="e.g. Reviewer" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="role-description">Description</Label>
        <textarea
          id="role-description"
          name="description"
          rows={3}
          className="flex w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="What this role can do, who it's for…"
        />
      </div>
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Creating…" : "Create role"}
      </Button>
    </form>
  );
}
