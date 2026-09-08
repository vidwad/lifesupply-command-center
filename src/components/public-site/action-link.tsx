import Link from "next/link";
import { ArrowRight, ExternalLink, Mail } from "lucide-react";

import { getAction, actionHref, type ActionKey } from "@/lib/public-site/actions";

const BASE = "lsh-display inline-flex items-center gap-2 px-5 py-3 text-[11px] transition-colors";

const VARIANTS = {
  primary: `${BASE} lsh-primary-action`,
  onDark: `${BASE} border border-white/45 text-white hover:border-white hover:bg-white hover:text-black`,
  onLight: `${BASE} border border-[var(--lsh-rule-strong)] text-[var(--lsh-charcoal)] hover:border-black hover:bg-black hover:text-white`,
  text: "lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)] transition-colors hover:text-[var(--lsh-red-hover)]",
} as const;

/**
 * A primary action rendered from the action registry. The registry decides
 * the destination and its kind; this component only decides how to draw it:
 * internal routes use next/link, external sites open in a new tab, and mail
 * or phone channels are plain anchors. Components never assemble a
 * destination themselves (registry.test.ts and the boundary canaries).
 */
export function ActionLink({
  action,
  variant = "primary",
  children,
  className = "",
}: {
  action: ActionKey;
  variant?: keyof typeof VARIANTS;
  children?: React.ReactNode;
  className?: string;
}) {
  const record = getAction(action);
  const href = actionHref(action);
  const label = children ?? record.label;
  const classes = `${VARIANTS[variant]} ${className}`.trim();

  switch (record.destination.kind) {
    case "internal":
      return (
        <Link href={href} className={classes}>
          {label} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      );
    case "external":
      return (
        <a href={href} target="_blank" rel="noreferrer" className={classes}>
          {label} <ExternalLink size={16} aria-hidden="true" />
        </a>
      );
    case "mailto":
      return (
        <a href={href} className={classes}>
          {label} <Mail size={16} aria-hidden="true" />
        </a>
      );
    case "tel":
      return (
        <a href={href} className={classes}>
          {label}
        </a>
      );
  }
}
