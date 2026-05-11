"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  setRolePermissionsAction,
  updateRoleAction,
  type RoleActionState,
} from "../actions";

type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  permissionIds: string[];
};

type Permission = {
  id: string;
  key: string;
  module: string;
  action: string;
  description: string | null;
};

export function RoleProfileForm({ role }: { role: Role }) {
  const [state, formAction, pending] = useActionState<RoleActionState, FormData>(
    updateRoleAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4 rounded-md border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Role profile</h2>
        {role.isSystemRole && (
          <span className="text-xs text-muted-foreground">System role — name is locked</span>
        )}
      </div>
      <input type="hidden" name="roleId" value={role.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={role.name}
            disabled={role.isSystemRole}
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={role.description ?? ""}
            className="flex w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-success">
          {state.ok}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

export function RolePermissionsForm({
  role,
  permissions,
}: {
  role: Role;
  permissions: Permission[];
}) {
  const [state, formAction, pending] = useActionState<RoleActionState, FormData>(
    setRolePermissionsAction,
    undefined,
  );

  const grouped = new Map<string, Permission[]>();
  for (const p of permissions) {
    if (!grouped.has(p.module)) grouped.set(p.module, []);
    grouped.get(p.module)!.push(p);
  }

  const assigned = new Set(role.permissionIds);

  return (
    <form action={formAction} className="space-y-4 rounded-md border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">Permissions</h2>
        <span className="text-xs text-muted-foreground">
          {role.permissionIds.length} of {permissions.length} assigned
        </span>
      </div>
      <input type="hidden" name="roleId" value={role.id} />
      <div className="space-y-4">
        {[...grouped.entries()].map(([module, perms]) => (
          <ModuleBlock
            key={module}
            module={module}
            permissions={perms}
            assigned={assigned}
          />
        ))}
      </div>
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-success">
          {state.ok}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save permissions"}
      </Button>
    </form>
  );
}

function ModuleBlock({
  module,
  permissions,
  assigned,
}: {
  module: string;
  permissions: Permission[];
  assigned: Set<string>;
}) {
  return (
    <fieldset className="rounded-md border bg-background/30 p-3">
      <legend className="px-1 text-xs uppercase tracking-wide text-muted-foreground">
        {module}
      </legend>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {permissions.map((p) => (
          <label
            key={p.id}
            className="flex items-start gap-2 rounded p-1.5 text-sm hover:bg-accent/40"
          >
            <input
              type="checkbox"
              name="permissionIds"
              value={p.id}
              defaultChecked={assigned.has(p.id)}
              className="mt-1 h-4 w-4 rounded border-input"
            />
            <div className="flex flex-col">
              <span className="font-mono text-xs">{p.action}</span>
              <span className="text-[11px] text-muted-foreground">{p.key}</span>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
