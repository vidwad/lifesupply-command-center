"use client";

import { DockActionsProvider, useDockActionState } from "./dock-actions";
import { MobileDock } from "./MobileDock";

type Props = {
  permissions: string[];
  counts: { approvalsCanDecide: number; myOverdueTasks: number };
  /** The assistant panel's content, rendered by the server shell; null when AI is not permitted. */
  assistant: React.ReactNode | null;
  children: React.ReactNode;
};

/**
 * Holds the phone dock's page keys between the pages that publish them and
 * the dock that shows them. A client boundary, so the server shell can
 * pass it the page and the assistant panel as rendered nodes.
 */
export function DockShell({ permissions, counts, assistant, children }: Props) {
  const [actions, onChange] = useDockActionState();
  return (
    <DockActionsProvider onChange={onChange}>
      {children}
      <MobileDock
        permissions={permissions}
        counts={counts}
        actions={actions}
        assistant={assistant}
      />
    </DockActionsProvider>
  );
}
