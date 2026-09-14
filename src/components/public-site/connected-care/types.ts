import type { StatusKind } from "@/components/public-site/connected-care/status-badge";
import type { DiagramIconName } from "@/components/public-site/connected-care/icons";

/**
 * The Connected Care diagram's configuration: one typed object, held in the
 * content model, that every layout of the diagram reads. Text and the
 * relationship mappings live here once, so the desktop network, the tablet
 * grid and the mobile sequence can never disagree.
 */
export type NodeKey = "supplies" | "clinic" | "care" | "pharmacy";
export type Highlightable = NodeKey | "hub";

export interface DiagramNode {
  key: NodeKey;
  /** Left nodes are the existing businesses; right nodes the proposed capabilities. */
  side: "left" | "right";
  icon: DiagramIconName;
  status: string;
  statusKind: StatusKind;
  title: string;
  text: string;
  /** The operating businesses behind the node, where there are any. */
  businesses?: readonly string[];
  detail: string;
  relationship: string;
  /** A second relationship line, for the care-to-pharmacy connection. */
  incoming?: string;
  link: { action: string; label: string };
}

export interface DiagramCapability {
  key: string;
  title: string;
  text: string;
  /** The nodes (and the hub) the capability could support: a conceptual mapping, never an integration. */
  supports: readonly Highlightable[];
  note: string;
}

export interface ConnectedCareDiagram {
  eyebrow: string;
  title: string;
  intro: string;
  statusNote: string;
  hub: { icon: DiagramIconName; title: string; tagline: string; text: string };
  nodes: readonly DiagramNode[];
  prescription: { from: NodeKey; to: NodeKey; label: string };
  technology: {
    icon: DiagramIconName;
    title: string;
    status: string;
    statusKind: StatusKind;
    text: string;
    capabilities: readonly DiagramCapability[];
  };
  emerging: { title: string; text: string; outside: string; action: string; label: string };
  note: string;
  labels: {
    relationship: string;
    businesses: string;
    viewRole: string;
    select: string;
    clear: string;
    supports: string;
    capabilitiesTitle: string;
  };
}
