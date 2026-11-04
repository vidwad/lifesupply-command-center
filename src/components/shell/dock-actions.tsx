"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

/**
 * The phone dock's page keys (2026-11-04, after the owner's pookt-operations
 * app). The dock's two middle keys differ by page: a page that has a primary
 * action publishes it with `useDockActions` while it is mounted, and the
 * dock shows it in place of a default destination. A key is a link or a
 * handler. Handlers are read through a ref at tap time, so a page may pass
 * a new array every render; only a change of ids or labels reaches the
 * provider.
 */
export type DockAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
};

type DockContextValue = { set: (actions: DockAction[] | null) => void };
const DockContext = createContext<DockContextValue | null>(null);

export function DockActionsProvider({
  children,
  onChange,
}: {
  children: ReactNode;
  onChange: (actions: DockAction[]) => void;
}) {
  const set = useCallback((actions: DockAction[] | null) => onChange(actions ?? []), [onChange]);
  const value = useMemo(() => ({ set }), [set]);
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

/** Holds the dock's page actions in the shell. Returns the actions and the provider's change handler. */
export function useDockActionState() {
  const [actions, setActions] = useState<DockAction[]>([]);
  const onChange = useCallback((next: DockAction[]) => setActions(next), []);
  return [actions, onChange] as const;
}

/** Publishes a page's keys to the dock while the page is mounted. Pass null or [] for none. */
export function useDockActions(actions: DockAction[] | null) {
  const context = useContext(DockContext);
  const latest = useRef<DockAction[] | null>(null);
  const key = actions ? actions.map((action) => `${action.id}:${action.label}`).join("|") : "";
  useEffect(() => {
    latest.current = actions;
  });
  useEffect(() => {
    if (!context) return;
    const current = latest.current ?? [];
    context.set(
      key
        ? current.map((action) => ({
            ...action,
            onClick: action.onClick
              ? () => latest.current?.find((item) => item.id === action.id)?.onClick?.()
              : undefined,
          }))
        : null,
    );
    return () => context.set(null);
  }, [context, key]);
}

/**
 * Publishes keys from a server-rendered page: render this with the keys as
 * data and no handlers. Links only, since a server page has no handlers.
 */
export function DockActions({ actions }: { actions: DockAction[] }) {
  useDockActions(actions);
  return null;
}
