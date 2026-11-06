"use client";

import { useState } from "react";

import { AssistantDrawer } from "@/components/ai/assistant/AssistantDrawer";
import { AssistantPageContextProvider } from "@/components/ai/assistant/page-context";

import { DockActionsProvider, useDockActionState } from "./dock-actions";
import { MobileDock } from "./MobileDock";

type Props = {
  permissions: string[];
  counts: { approvalsCanDecide: number; myOverdueTasks: number };
  /** The assistant drawer's settings; null when the person cannot use AI. */
  assistant: { suggestions: string[] } | null;
  children: React.ReactNode;
};

/**
 * The shell's client boundary (2026-11-04; the drawer 2026-11-06). It holds
 * the phone dock's page keys between the pages that publish them and the
 * dock that shows them, the page context the assistant reads, and whether
 * the assistant sheet is open on a phone: the dock's AI key and the sheet's
 * own close button share that state.
 */
export function DockShell({ permissions, counts, assistant, children }: Props) {
  const [actions, onChange] = useDockActionState();
  const [assistantOpen, setAssistantOpen] = useState(false);
  return (
    <DockActionsProvider onChange={onChange}>
      <AssistantPageContextProvider>
        {children}
        {assistant && (
          <AssistantDrawer
            suggestions={assistant.suggestions}
            open={assistantOpen}
            onOpenChange={setAssistantOpen}
          />
        )}
        <MobileDock
          permissions={permissions}
          counts={counts}
          actions={actions}
          onAssistant={assistant ? () => setAssistantOpen((v) => !v) : null}
          assistantOpen={assistantOpen}
        />
      </AssistantPageContextProvider>
    </DockActionsProvider>
  );
}
