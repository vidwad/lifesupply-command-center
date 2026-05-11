"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  resetPasswordAction,
  setRolesAction,
  updateProfileAction,
  type UserActionState,
} from "../actions";

type UserSummary = {
  id: string;
  email: string;
  name: string | null;
  title: string | null;
  department: string | null;
  roles: { id: string; name: string }[];
};

type Role = { id: string; name: string; description: string | null };

export function ProfileForm({ user }: { user: UserSummary }) {
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    updateProfileAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4 rounded-md border bg-card p-4">
      <h2 className="text-sm font-medium">Profile</h2>
      <input type="hidden" name="userId" value={user.id} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Email">
          <Input value={user.email} disabled />
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </Field>
        <Field label="Display name" htmlFor="name">
          <Input id="name" name="name" defaultValue={user.name ?? ""} autoComplete="off" />
        </Field>
        <Field label="Title" htmlFor="title">
          <Input id="title" name="title" defaultValue={user.title ?? ""} autoComplete="off" />
        </Field>
        <Field label="Department" htmlFor="department">
          <Input
            id="department"
            name="department"
            defaultValue={user.department ?? ""}
            autoComplete="off"
          />
        </Field>
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

export function RolesForm({
  user,
  roles,
  isSelf,
}: {
  user: UserSummary;
  roles: Role[];
  isSelf: boolean;
}) {
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    setRolesAction,
    undefined,
  );
  const assignedSet = new Set(user.roles.map((r) => r.id));
  return (
    <form action={formAction} className="space-y-4 rounded-md border bg-card p-4">
      <h2 className="text-sm font-medium">Roles</h2>
      <input type="hidden" name="userId" value={user.id} />
      {isSelf && (
        <p className="text-xs text-muted-foreground">
          You can edit your own roles, but at least one role must remain assigned.
        </p>
      )}
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
              defaultChecked={assignedSet.has(role.id)}
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
        {pending ? "Saving…" : "Save roles"}
      </Button>
    </form>
  );
}

export function PasswordResetForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    resetPasswordAction,
    undefined,
  );
  const [reveal, setReveal] = useState(false);
  return (
    <form action={formAction} className="space-y-3 rounded-md border bg-card p-4">
      <h2 className="text-sm font-medium">Reset password</h2>
      <input type="hidden" name="userId" value={userId} />
      <div className="relative">
        <Input
          name="password"
          type={reveal ? "text" : "password"}
          placeholder="New password (min 12 chars)"
          minLength={12}
          required
          autoComplete="new-password"
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setReveal((r) => !r)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-accent"
          aria-label={reveal ? "Hide" : "Show"}
          tabIndex={-1}
        >
          {reveal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Share the new password securely. The user should change it on next sign-in.
      </p>
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
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
