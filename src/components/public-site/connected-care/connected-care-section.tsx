"use client";

import { ChevronDown } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";

import { ActionLink } from "@/components/public-site/action-link";
import { BusinessNode } from "@/components/public-site/connected-care/business-node";
import { ConnectionLayer } from "@/components/public-site/connected-care/connection-layer";
import { PatientHub } from "@/components/public-site/connected-care/patient-hub";
import { TechnologyFoundation } from "@/components/public-site/connected-care/technology-foundation";
import type {
  ConnectedCareDiagram,
  Highlightable,
  NodeKey,
} from "@/components/public-site/connected-care/types";
import type { ActionKey } from "@/lib/public-site/actions";

/**
 * The Connected Care diagram (product owner, 2026-09-13): the patient's
 * needs at the centre, the two existing businesses on the left, the two
 * proposed capabilities on the right, and the technology foundation
 * beneath, with one expandable item on emerging therapies and one note.
 *
 * Three layouts from one configuration and one DOM, chosen by the
 * component's own width in the stylesheet (`.lsh-cc-*`): a network with
 * measured connectors from about 1100px, a two-column grid under a
 * full-width hub from about 640px, and a single-column sequence on a phone that
 * reads hub, technology summary, the four cards, then the capabilities.
 *
 * Restrained interaction: selecting a node highlights its connection and
 * the capabilities that could support it; selecting a capability highlights
 * the nodes it could support and shows one sentence; every node's detail is
 * a native disclosure; Escape or the clear button resets. The initial state
 * is complete without any of it.
 */
type Selection = { kind: "node"; key: NodeKey } | { kind: "capability"; key: string } | null;

export function ConnectedCareSection({ diagram }: { diagram: ConnectedCareDiagram }) {
  const [selection, setSelection] = useState<Selection>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const hubRef = useRef<HTMLDivElement | null>(null);
  const techRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Partial<Record<NodeKey, HTMLElement | null>>>({});
  const detailsId = useId();

  const capability =
    selection?.kind === "capability"
      ? (diagram.technology.capabilities.find((c) => c.key === selection.key) ?? null)
      : null;

  const highlighted = useMemo(() => {
    const set = new Set<Highlightable>();
    if (selection?.kind === "node") {
      set.add(selection.key);
      set.add("hub");
    } else if (capability) {
      for (const key of capability.supports) set.add(key);
    }
    return set;
  }, [selection, capability]);

  const highlightedCapabilities = useMemo(() => {
    const set = new Set<string>();
    if (selection?.kind === "node") {
      for (const c of diagram.technology.capabilities) {
        if (c.supports.includes(selection.key)) set.add(c.key);
      }
    }
    return set;
  }, [selection, diagram.technology.capabilities]);

  const names = (keys: readonly Highlightable[]) =>
    keys
      .map((key) =>
        key === "hub"
          ? diagram.hub.title
          : (diagram.nodes.find((n) => n.key === key)?.title ?? key),
      )
      .join(", ");

  const selectNode = (key: NodeKey) =>
    setSelection((current) =>
      current?.kind === "node" && current.key === key ? null : { kind: "node", key },
    );
  const selectCapability = (key: string) =>
    setSelection((current) =>
      current?.kind === "capability" && current.key === key ? null : { kind: "capability", key },
    );

  return (
    <div
      className="lsh-cc"
      onKeyDown={(event) => {
        if (event.key === "Escape" && selection) {
          event.preventDefault();
          setSelection(null);
        }
      }}
    >
      {/* The status explanation, once, and the clear control on a reserved line so nothing shifts. */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-2xl border-l-2 border-[var(--lsh-brand-red)] pl-4 text-sm leading-6 text-[var(--lsh-charcoal)]">
          {diagram.statusNote}
        </p>
        <div className="min-h-11">
          <button
            type="button"
            hidden={!selection}
            onClick={() => setSelection(null)}
            className={`lsh-display min-h-11 border border-[var(--lsh-rule-strong)] px-3 text-[10px] text-[var(--lsh-charcoal)] transition-colors hover:border-[var(--lsh-charcoal)] ${selection ? "" : "hidden"}`}
          >
            {diagram.labels.clear}
          </button>
        </div>
      </div>

      <div ref={gridRef} className="lsh-cc-grid">
        <ConnectionLayer
          gridRef={gridRef}
          anchors={{ hub: hubRef, nodes: nodeRefs, tech: techRef }}
          nodes={diagram.nodes}
          prescription={diagram.prescription}
          highlighted={highlighted}
          techActive={capability !== null}
        />
        <PatientHub hub={diagram.hub} highlighted={highlighted.has("hub")} ref={hubRef} />
        <TechnologyFoundation
          technology={diagram.technology}
          labels={diagram.labels}
          selectedCapability={capability?.key ?? null}
          highlightedCapabilities={highlightedCapabilities}
          onSelect={selectCapability}
          detailsId={detailsId}
          names={names}
          ref={techRef}
        />
        {diagram.nodes.map((node) => (
          <BusinessNode
            key={node.key}
            node={node}
            labels={diagram.labels}
            selected={selection?.kind === "node" && selection.key === node.key}
            highlighted={highlighted.has(node.key)}
            onSelect={selectNode}
            ref={(el) => {
              nodeRefs.current[node.key] = el;
            }}
          />
        ))}
        <details className="lsh-cc-emerging group border border-dashed border-[var(--lsh-rule-strong)] px-5 py-3">
          <summary className="lsh-display flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[11px] text-[var(--lsh-charcoal)] [&::-webkit-details-marker]:hidden">
            {diagram.emerging.title}
            <ChevronDown
              size={14}
              aria-hidden="true"
              className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--lsh-muted)]">
            {diagram.emerging.text}
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--lsh-muted)]">
            {diagram.emerging.outside}
          </p>
          <div className="mb-2 mt-4">
            <ActionLink action={diagram.emerging.action as ActionKey} variant="onLight">
              {diagram.emerging.label}
            </ActionLink>
          </div>
        </details>
        <p className="lsh-cc-note text-xs leading-5 text-[var(--lsh-muted)]">{diagram.note}</p>
      </div>
    </div>
  );
}
