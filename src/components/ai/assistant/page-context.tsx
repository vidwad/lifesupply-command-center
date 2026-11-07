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
 *
 * The registration must settle. On 2026-11-07 the registering effect
 * depended on the whole context value, which the provider replaced on
 * every registration, so each registration re-ran the effect and the page
 * re-rendered without end: no error, but every navigation starved and the
 * sidebar stopped working on every page that registers. The effect now
 * depends on the stable setter and the serialised context only, and the
 * setter keeps the previous object when the content is unchanged.
 */
type Setter = (context: PageContext | null) => void;
type ContextValue = { context: PageContext | null; set: Setter };
const Context = createContext<ContextValue | null>(null);

/** Pure: the next state for a registration, keeping identity when nothing changed. */
export function nextPageContext(
  previous: PageContext | null,
  incoming: PageContext | null,
): PageContext | null {
  if (previous === incoming) return previous;
  if (previous && incoming && JSON.stringify(previous) === JSON.stringify(incoming)) {
    return previous;
  }
  return incoming;
}

export function AssistantPageContextProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<PageContext | null>(null);
  const set = useCallback<Setter>((next) => {
    setContext((previous) => nextPageContext(previous, next));
  }, []);
  const value = useMemo(() => ({ context, set }), [context, set]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Registers a page's context while the component is mounted. */
export function useAssistantPageContext(context: PageContext | null) {
  const set = useContext(Context)?.set;
  // Keyed by content, so a page may pass a fresh object every render.
  const key = context ? JSON.stringify(context) : "";
  useEffect(() => {
    if (!set) return;
    set(key ? (JSON.parse(key) as PageContext) : null);
    return () => set(null);
  }, [set, key]);
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
