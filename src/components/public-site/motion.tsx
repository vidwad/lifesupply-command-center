"use client";

/**
 * Motion primitives for the public LifeSupply site.
 *
 * Adapted from 21st.dev components, re-cut on the brand tokens and with one
 * rule they do not all carry: every animation collapses to its final state
 * for visitors who prefer reduced motion, so nothing here is ever the only
 * way to reach content.
 *
 *   Reveal / Stagger / StaggerItem   ibelick "In view" (motion useInView)
 *   HeroTitle                        tom_ui "Words Stagger"
 *   CountUp                          danielpetho "Number Ticker"
 *   SpotlightCard                    preetsuthar17 "Spotlight Card"
 *   ScrollBeam                       Aceternity "Timeline" beam
 *
 * Colour is expressed only through the --lsh-* tokens or rgba(); the
 * boundary canaries reject raw hex in public components.
 */
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type Transition,
  type Variants,
} from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const EASE: Transition["ease"] = [0.23, 1, 0.32, 1];

/**
 * Reduced motion collapses every entrance to its final state instantly.
 *
 * The primitives always render their "hidden" variant first, on the server
 * and on the client alike, so hydration matches; the preference then decides
 * the transition (instant) and the trigger (mount, not scroll), so every
 * section is fully opaque without scrolling. Dropping the variants for reduced-motion visitors
 * instead (the first build) left the server's hidden styles on the elements
 * after hydration, and the content never appeared for them.
 */
const INSTANT: Transition = { duration: 0 };
/** Reduced motion: everything becomes visible on mount, without scrolling. */
const IMMEDIATE = { animate: "visible" } as const;
const IN_VIEW_REVEAL = {
  whileInView: "visible",
  viewport: { once: true, margin: "0px 0px -80px 0px" },
} as const;
const IN_VIEW_STAGGER = {
  whileInView: "visible",
  viewport: { once: true, margin: "0px 0px -60px 0px" },
} as const;

/**
 * Entrances fade and rise. They never blur: a heading or a sentence must be
 * readable the instant it is painted, and a blur filter makes meaningful
 * text depend on an animation finishing (round two, 2026-09-10).
 */
const rise: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/** Fade and rise once, when the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={rise}
      initial="hidden"
      {...(reduce ? IMMEDIATE : IN_VIEW_REVEAL)}
      transition={reduce ? INSTANT : { duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/** Fade and rise on mount, for hero copy that is on screen before any scroll. */
export function Enter({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={rise}
      initial="hidden"
      animate="visible"
      transition={reduce ? INSTANT : { duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const staggerParentInstant: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0, delayChildren: 0 } },
};

/** A list or grid whose children (StaggerItem) enter one after another. */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** `ol` for a sequence whose order carries meaning, such as numbered steps. */
  as?: "div" | "ul" | "ol";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={reduce ? staggerParentInstant : staggerParent}
      initial="hidden"
      {...(reduce ? IMMEDIATE : IN_VIEW_STAGGER)}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={rise}
      transition={reduce ? INSTANT : { duration: 0.6, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/**
 * The route's h1, entering word by word. The words stay real text inside a
 * single heading element, so the accessible name and the one-h1 rule are
 * unchanged; only the presentation is staggered.
 */
export function HeroTitle({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const word: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduce ? INSTANT : { duration: 0.55, ease: EASE },
    },
  };
  const parent: Variants = {
    hidden: {},
    visible: {
      transition: reduce
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: 0.06, delayChildren: 0.15 },
    },
  };
  return (
    <motion.h1 className={className} variants={parent} initial="hidden" animate="visible">
      {words.map((item, index) => (
        // The separating space must be a text node OUTSIDE the inline-block:
        // trailing whitespace inside an inline-block collapses to nothing.
        <span key={`${item}-${index}`}>
          <motion.span className="inline-block" variants={word}>
            {item}
          </motion.span>
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </motion.h1>
  );
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/**
 * The reduced-motion preference as a hydration-safe value. `useReducedMotion`
 * from the motion package is null on the server and already true on a
 * reduced-motion client's first render, so a component whose markup depends
 * on it hydrates against different text (React #418). The server snapshot
 * here is "reduced", so the server and the first client render agree, and
 * React re-renders synchronously with the real preference afterwards.
 */
function useHydratedReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );
}

/** "$6.75M" → { prefix: "$", value: 6.75, decimals: 2, suffix: "M" }. */
function parseFigure(raw: string) {
  const match = raw.match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  const decimals = digits?.split(".")[1]?.length ?? 0;
  return {
    prefix: prefix ?? "",
    value: Number(digits?.replace(/,/g, "")),
    decimals,
    suffix: suffix ?? "",
  };
}

/**
 * A reported figure that counts up from zero the first time it scrolls into
 * view. The formatted string is the same text the content model holds, so
 * what the visitor ends on is exactly what was approved. Figures the parser
 * does not understand, and reduced-motion visitors, get the static text.
 */
export function CountUp({
  value,
  className,
  suffixClassName,
}: {
  value: string;
  className?: string;
  /** Styles the unit or sign after the digits ("+", "M", "K") separately from the digits. */
  suffixClassName?: string;
}) {
  const reduce = useHydratedReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });
  const parsed = parseFigure(value);
  const count = useMotionValue(0);
  const decimals = parsed?.decimals ?? 0;
  const text = useTransform(count, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    if (!inView || !parsed || reduce) return;
    const controls = animate(count, parsed.value, { duration: 1.6, ease: EASE });
    return () => controls.stop();
    // `parsed` is derived from `value`, which is the only input that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);

  if (!parsed || reduce) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`.trim()}>
      {parsed.prefix}
      <motion.span>{text}</motion.span>
      {parsed.suffix ? <span className={suffixClassName}>{parsed.suffix}</span> : null}
    </span>
  );
}

/**
 * A card with a red spotlight that follows the pointer. The glow is a
 * pointer-only flourish on top of the .lsh-lift hover state, so keyboard and
 * touch visitors lose nothing; the card's own border and shadow still answer.
 */
export function SpotlightCard({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const onMouseMove = (event: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`.trim()}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
        aria-hidden="true"
        style={{
          opacity,
          background: `radial-gradient(360px circle at ${position.x}px ${position.y}px, rgba(222,0,0,0.14), transparent 70%)`,
        }}
      />
      <div className="relative">{children}</div>
    </Tag>
  );
}

/**
 * A vertical rule beside a list that fills in brand red as the visitor
 * scrolls through it. Scale-based, so it needs no measurement of the list.
 */
export function ScrollBeam({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <div ref={ref} className={`relative ${className}`.trim()}>
      <div className="absolute bottom-0 left-0 top-0 w-0.5 bg-[var(--lsh-rule)]" aria-hidden="true">
        <motion.div
          className="absolute inset-0 origin-top bg-[var(--lsh-brand-red)]"
          style={{ scaleY: reduce ? 1 : scaleY }}
        />
      </div>
      {children}
    </div>
  );
}
