"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { getLegacyBand, type LegacyBandKey } from "@/lib/public-site/legacy-bands";

const OVERLAYS = {
  /** Brand-red tint, the photograph well behind it. */
  red: "[background-image:linear-gradient(100deg,rgba(222,0,0,0.86)_0%,rgba(222,0,0,0.62)_55%,rgba(20,20,20,0.72)_100%)]",
  /** A lighter red tint that lets more of the photograph through. */
  redLight:
    "[background-image:linear-gradient(100deg,rgba(222,0,0,0.6)_0%,rgba(222,0,0,0.38)_55%,rgba(20,20,20,0.5)_100%)]",
  /** Charcoal with a red edge. */
  ink: "[background-image:linear-gradient(100deg,rgba(20,20,20,0.9)_0%,rgba(20,20,20,0.55)_60%,rgba(222,0,0,0.7)_100%)]",
} as const;

/**
 * A full-width photographic divider between two sections, in the manner of
 * the prior About page's fixed-background bands: the greyscale photograph
 * drifts against the page (a parallax of about half the band's height
 * across its time on screen, so the movement is plainly visible), behind
 * the site's overlay colouring and under a red rule.
 *
 * The photograph is decorative: its layer is hidden from assistive
 * technology and its alt is empty, so the picture never makes a claim.
 * With `eyebrow` and `statement` the band carries one short line of
 * approved copy over the overlay, which is read like any other text;
 * without them the whole band is presentational. Visitors who prefer
 * reduced motion get the same band without the drift.
 */
export function ParallaxBand({
  band,
  tone = "red",
  eyebrow,
  statement,
}: {
  band: LegacyBandKey;
  tone?: keyof typeof OVERLAYS;
  eyebrow?: string;
  statement?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-25%", "25%"]);
  const image = getLegacyBand(band);
  const hasText = Boolean(statement);
  return (
    <div
      ref={ref}
      role={hasText ? undefined : "presentation"}
      aria-hidden={hasText ? undefined : "true"}
      data-band={band}
      className="relative flex min-h-64 items-center overflow-hidden bg-[var(--lsh-ink)] px-5 py-16 text-white sm:min-h-80 lg:min-h-[24rem] lg:px-8 lg:py-20"
    >
      <motion.div
        aria-hidden="true"
        style={reduce ? undefined : { y }}
        className="absolute inset-x-0 top-[-30%] h-[160%] will-change-transform"
      >
        <Image
          src={image.src}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          draggable={false}
        />
      </motion.div>
      <span
        aria-hidden="true"
        className={`absolute inset-0 mix-blend-multiply ${OVERLAYS[tone]}`}
      />
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[var(--lsh-brand-red)]" />
      {hasText ? (
        <div className="relative mx-auto w-full max-w-7xl">
          <div className="max-w-3xl border-l-4 border-white pl-6 sm:pl-7">
            {eyebrow ? <p className="lsh-display text-[11px] text-white/85">{eyebrow}</p> : null}
            <p className="lsh-display mt-4 text-2xl leading-[1.08] sm:text-3xl lg:text-4xl">
              {statement}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The same kind of photograph as a hero's decorative media layer: it fills
 * the hero beneath the PublicHero scrim, which keeps the copy's contrast on
 * the left while the scene shows through on the right. Static, so the h1
 * never has a moving field behind it.
 */
export function HeroBackdrop({
  band,
  prominence = "standard",
  position,
}: {
  band: LegacyBandKey;
  /**
   * `full` carries the photograph at its own density rather than at 80%, for
   * a hero that leads on the picture (product owner, 2026-09-12). Pair it
   * with PublicHero's lighter scrim, or the gain is spent under the black.
   */
  prominence?: "standard" | "full";
  /** CSS object-position, to keep the subject clear of the copy. */
  position?: string;
}) {
  const image = getLegacyBand(band);
  return (
    <div aria-hidden="true" data-hero-band={band} className="absolute inset-0">
      <Image
        src={image.src}
        alt=""
        fill
        priority
        sizes="100vw"
        style={position ? { objectPosition: position } : undefined}
        className={`object-cover ${prominence === "full" ? "opacity-100" : "opacity-80"}`}
        draggable={false}
      />
    </div>
  );
}
