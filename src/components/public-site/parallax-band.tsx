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
 * Decorative only. The band is hidden from assistive technology, carries no
 * text, and the photograph's alt is empty, so the picture never makes a
 * claim. Visitors who prefer reduced motion get the same band without the
 * drift.
 */
export function ParallaxBand({
  band,
  tone = "red",
}: {
  band: LegacyBandKey;
  tone?: keyof typeof OVERLAYS;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-25%", "25%"]);
  const image = getLegacyBand(band);
  return (
    <div
      ref={ref}
      role="presentation"
      aria-hidden="true"
      data-band={band}
      className="relative h-64 overflow-hidden bg-[var(--lsh-ink)] sm:h-80 lg:h-[24rem]"
    >
      <motion.div
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
    </div>
  );
}

/**
 * The same kind of photograph as a hero's decorative media layer: it fills
 * the hero beneath the PublicHero scrim, which keeps the copy's contrast on
 * the left while the scene shows through on the right. Static, so the h1
 * never has a moving field behind it.
 */
export function HeroBackdrop({ band }: { band: LegacyBandKey }) {
  const image = getLegacyBand(band);
  return (
    <div aria-hidden="true" data-hero-band={band} className="absolute inset-0">
      <Image
        src={image.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-80"
        draggable={false}
      />
    </div>
  );
}
