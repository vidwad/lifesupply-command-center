"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createUserAction, type UserActionState } from "../actions";

type Props = {
  roles: { id: string; name: string; description: string | null }[];
};

export function UserCreateForm({ roles }: Props) {
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    createUserAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-4 rounded-md border bg-card p-4">
        <h2 className="text-sm font-medium">Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email" htmlFor="email" required>
            <Input id="email" name="email" type="email" required autoComplete="off" />
          </Field>
          <Field label="Display name" htmlFor="name">
            <Input id="name" name="name" autoComplete="off" />
          </Field>
          <Field label="Title" htmlFor="title">
            <Input id="title" name="title" autoComplete="off" />
          </Field>
          <Field label="Department" htmlFor="department">
            <Input id="department" name="department" autoComplete="off" />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-md border bg-card p-4">
        <h2 className="text-sm font-medium">Account</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Initial password" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              placeholder="Minimum 12 characters"
            />
            <p className="text-xs text-muted-foreground">
              Share this securely with the user — they should change it on first sign-in.
            </p>
          </Field>
          <Field label="Status" htmlFor="status" required>
            <select
              id="status"
              name="status"
              defaultValue="invited"
              required
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="invited">Invited (cannot sign in until activated)</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-md border bg-card p-4">
        <h2 className="text-sm font-medium">Roles</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent/40"
            >
              <input
                type="checkbox"
                name="roleIds"
                value={role.id}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <div className="text-sm">
                <div className="font-medium">{role.name}</div>
                {role.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground">{role.description}</div>
                )}
              </div>
            </label>
          ))}
        </div>
      </section>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create user"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
