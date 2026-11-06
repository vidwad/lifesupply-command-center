"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { navItemForPath } from "@/components/shell/nav-config";
import type { AssistantPageContext as PageContext } from "@/server/services/ai/assistant/types";

export type { PageContext as AssistantPageContextValue };

/**
 * What the page tells the assistant it is showing (docs/43 §4.4,
 * 2026-11-06). A page registers a small typed object while it is mounted;
 * the drawer reads it on every turn, so navigating changes what the
 * assistant knows without restarting the conversation. A page that
 * registers nothing still has a route and the module's name.
 */
type ContextValue = {
  context: PageContext | null;
  set: (context: PageContext | null) => void;
};
const Context = createContext<ContextValue | null>(null);

export function AssistantPageContextProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<PageContext | null>(null);
  const set = useCallback((next: PageContext | null) => setContext(next), []);
  const value = useMemo(() => ({ context, set }), [context, set]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Registers a page's context while the component is mounted. */
export function useAssistantPageContext(context: PageContext | null) {
  const holder = useContext(Context);
  // Keyed by content, so a page may pass a fresh object every render.
  const key = context ? JSON.stringify(context) : "";
  useEffect(() => {
    if (!holder) return;
    holder.set(key ? (JSON.parse(key) as PageContext) : null);
    return () => holder.set(null);
  }, [holder, key]);
}

/** Registers context from a server-rendered page: render it with the context as data. */
export function AssistantPageContext({ value }: { value: PageContext }) {
  useAssistantPageContext(value);
  return null;
}

/**
 * The context the drawer sends: the registered one, or the route and the
 * module's name when the page registered nothing.
 */
export function useCurrentAssistantPageContext(): PageContext {
  const holder = useContext(Context);
  const pathname = usePathname();
  return useMemo(() => {
    if (holder?.context) return holder.context;
    const item = navItemForPath(pathname);
    return item ? { route: pathname, title: item.label } : { route: pathname };
  }, [holder?.context, pathname]);
}
