"use client";

import { useEffect, useState } from "react";

import type {
  DiagramNode,
  Highlightable,
  NodeKey,
} from "@/components/public-site/connected-care/types";

/**
 * The connectors of the desktop network, drawn as one SVG over the grid from
 * the measured edges of the real cards, so they survive wrapping, resizing
 * and font loading. Decorative and hidden from assistive technology: every
 * relationship is also written in the cards.
 *
 *   node to hub          solid for an existing business, dashed for a
 *                        proposed capability; a line never implies ownership
 *                        or data exchange
 *   care to pharmacy     dashed, labelled in the pharmacy card
 *   the rail             a dashed rail beneath the lower row and the hub,
 *                        dropping to the technology foundation: the shared
 *                        structure the platform could provide
 *
 * Only measured when the grid is wide enough for the network; below that the
 * stylesheet hides the layer and nothing is computed. Measurements are
 * coalesced to one frame, and no line is routed through a card.
 */
interface Line {
  key: string;
  d: string;
  kind: "existing" | "proposed" | "tech";
  on: boolean;
  dim: boolean;
}

export interface Anchors {
  hub: React.RefObject<HTMLDivElement | null>;
  nodes: React.RefObject<Partial<Record<NodeKey, HTMLElement | null>>>;
  tech: React.RefObject<HTMLDivElement | null>;
}

const NETWORK_MIN_WIDTH = 1100;

/** Literal class names, so the stylesheet's content scan keeps every modifier. */
const KIND_CLASS: Record<Line["kind"], string> = {
  existing: "lsh-cc-line--existing",
  proposed: "lsh-cc-line--proposed",
  tech: "lsh-cc-line--tech",
};

function box(el: Element, origin: DOMRect) {
  const r = el.getBoundingClientRect();
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
}

export function ConnectionLayer({
  gridRef,
  anchors,
  nodes,
  prescription,
  highlighted,
  techActive,
}: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  anchors: Anchors;
  nodes: readonly DiagramNode[];
  prescription: { from: NodeKey; to: NodeKey };
  highlighted: ReadonlySet<Highlightable>;
  /** True while a capability is selected: the rail lights up with it. */
  techActive: boolean;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [geometry, setGeometry] = useState<Omit<Line, "on" | "dim">[]>([]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const origin = grid.getBoundingClientRect();
      if (origin.width < NETWORK_MIN_WIDTH) {
        setSize(null);
        return;
      }
      const hubEl = anchors.hub.current;
      const techEl = anchors.tech.current;
      if (!hubEl || !techEl) return;
      const hub = box(hubEl, origin);
      const tech = box(techEl, origin);
      const lines: Omit<Line, "on" | "dim">[] = [];
      const rects: Partial<Record<NodeKey, ReturnType<typeof box>>> = {};
      for (const node of nodes) {
        const el = anchors.nodes.current?.[node.key];
        if (!el) continue;
        const n = box(el, origin);
        rects[node.key] = n;
        const startX = node.side === "left" ? n.x + n.w : n.x;
        const startY = n.y + n.h / 2;
        const endX = node.side === "left" ? hub.x : hub.x + hub.w;
        const endY = Math.min(Math.max(startY, hub.y + 28), hub.y + hub.h - 28);
        const bend = (endX - startX) * 0.45;
        lines.push({
          key: node.key,
          d: `M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`,
          kind: node.statusKind === "existing" ? "existing" : "proposed",
        });
      }
      const from = rects[prescription.from];
      const to = rects[prescription.to];
      if (from && to && to.y > from.y + from.h) {
        const x = from.x + from.w / 2;
        lines.push({
          key: "prescription",
          d: `M ${x} ${from.y + from.h} L ${x} ${to.y}`,
          kind: "proposed",
        });
      }
      // The rail: beneath the lower row and the hub, then down to the foundation.
      const lower = nodes.filter((node) => rects[node.key] && rects[node.key]!.y > hub.y + 10);
      const railY = tech.y - 26;
      const feet = [
        ...lower.map((node) => {
          const n = rects[node.key]!;
          return { key: `rail-${node.key}`, x: n.x + n.w / 2, y: n.y + n.h };
        }),
        { key: "rail-hub", x: hub.x + hub.w / 2, y: hub.y + hub.h },
      ].filter((foot) => foot.y < railY - 4);
      if (feet.length > 0) {
        const xs = feet.map((foot) => foot.x);
        lines.push({
          key: "rail",
          d: `M ${Math.min(...xs)} ${railY} L ${Math.max(...xs)} ${railY}`,
          kind: "tech",
        });
        for (const foot of feet) {
          lines.push({
            key: foot.key,
            d: `M ${foot.x} ${foot.y} L ${foot.x} ${railY}`,
            kind: "tech",
          });
        }
        const drop = hub.x + hub.w / 2;
        lines.push({ key: "rail-drop", d: `M ${drop} ${railY} L ${drop} ${tech.y}`, kind: "tech" });
      }
      setSize({ w: origin.width, h: origin.height });
      setGeometry(lines);
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(grid);
    const hubEl = anchors.hub.current;
    const techEl = anchors.tech.current;
    if (hubEl) observer.observe(hubEl);
    if (techEl) observer.observe(techEl);
    for (const el of Object.values(anchors.nodes.current ?? {})) if (el) observer.observe(el);
    schedule();
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(schedule).catch(() => undefined);
    }
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
    // Anchors are stable refs; nodes and prescription come from the content model.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridRef, nodes, prescription.from, prescription.to]);

  if (!size) return null;
  const anySelected = highlighted.size > 0 || techActive;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="lsh-cc-lines"
      viewBox={`0 0 ${size.w} ${size.h}`}
      width={size.w}
      height={size.h}
      preserveAspectRatio="none"
    >
      {geometry.map((line) => {
        const nodeKey = line.key.replace(/^rail-/, "") as Highlightable;
        const on =
          line.kind === "tech"
            ? techActive ||
              (line.key !== "rail" && line.key !== "rail-drop" && highlighted.has(nodeKey))
            : line.key === "prescription"
              ? highlighted.has(prescription.from) || highlighted.has(prescription.to)
              : highlighted.has(nodeKey);
        return (
          <path
            key={line.key}
            d={line.d}
            className={[
              "lsh-cc-line",
              KIND_CLASS[line.kind],
              on ? "lsh-cc-line--on" : anySelected ? "lsh-cc-line--dim" : "",
            ]
              .join(" ")
              .trim()}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
