"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { getLegacyBand, type LegacyBandKey } from "@/lib/public-site/legacy-bands";

/**
 * A full-width photographic divider between two sections, in the manner of
 * the prior About page's fixed-background bands: the greyscale photograph
 * drifts a little slower than the page (a parallax of about a quarter of
 * the band's height across its time on screen), behind the site's overlay
 * colouring and under a red rule.
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
  /** Red tints the photograph brand-red; ink keeps it charcoal with a red edge. */
  tone?: "red" | "ink";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const image = getLegacyBand(band);
  const overlay =
    tone === "red"
      ? "[background-image:linear-gradient(100deg,rgba(222,0,0,0.86)_0%,rgba(222,0,0,0.62)_55%,rgba(20,20,20,0.72)_100%)]"
      : "[background-image:linear-gradient(100deg,rgba(20,20,20,0.9)_0%,rgba(20,20,20,0.55)_60%,rgba(222,0,0,0.7)_100%)]";
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
        className="absolute inset-x-0 top-[-15%] h-[130%] will-change-transform"
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
      <span aria-hidden="true" className={`absolute inset-0 mix-blend-multiply ${overlay}`} />
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[var(--lsh-brand-red)]" />
    </div>
  );
}
