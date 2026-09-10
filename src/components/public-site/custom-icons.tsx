import type { SVGProps } from "react";

/**
 * Three icons drawn for the homepage "Where to start" cards (2026-09-10).
 *
 * The rest of the site uses lucide. These three had no lucide equivalent that
 * said the right thing: the nearest candidates (LayoutGrid, Handshake,
 * LineChart) are generic where these cards are specific. Codex drew them to
 * the lucide construction rules so they sit beside the stock set without
 * looking foreign, and they were rendered at 18px, 24px and on charcoal
 * before being accepted.
 *
 * They are SVG rather than raster on purpose: the stroke inherits
 * `currentColor`, so the same file works in brand red on paper and in the
 * lighter red on ink, and nothing is stored as a colour value.
 */
type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

/** The lucide construction: 24-unit grid, hairline stroke, round joins. */
function frame({ size = 24, strokeWidth = 1.75, ...rest }: IconProps) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...rest,
  };
}

/** Four businesses under one group: three storefronts and one project frame. */
export function OperatingBusinesses(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <path d="M3 6h7M14 6h7M3 17h7" />
    </svg>
  );
}

/** Several kinds of counterparty converging on one conversation. */
export function PartnershipOpportunities(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="m3 4 5 4" />
      <path d="M2 12h6" />
      <path d="m3 20 5-4" />
      <path d="M14 5h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3l-4 3V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

/** A report carrying a growth trace above a dated record. */
export function InvestorInformation(props: IconProps) {
  return (
    <svg {...frame(props)}>
      <path d="M5 3h10l4 4v14H5Z" />
      <path d="M15 3v4h4" />
      <path d="m8 13 3-3 3 2 2-3" />
      <path d="M5 16h14" />
      <path d="M8 19h2m3 0h3" />
    </svg>
  );
}
