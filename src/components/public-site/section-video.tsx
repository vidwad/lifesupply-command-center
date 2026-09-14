"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * A short clip inside a section, played once when the page loads and left
 * on its final frame (product owner, 2026-09-14, for the homepage's "Who are
 * we and what we do" section): the prior site's home-page video, cut to its
 * first fourteen seconds so that it stops there without a script.
 *
 * Decoration beside the copy: the layer is hidden from assistive technology,
 * carries no audio track and no playback control, and never loops. Visitors
 * who prefer reduced motion get the poster only; the preference is read with
 * useSyncExternalStore and the server snapshot is "reduced", so the server
 * never renders a video element and nothing is fetched until the browser
 * has said motion is welcome. WebM first, MP4 as the H.264 fallback.
 */
export function SectionVideo({
  webm,
  mp4,
  poster,
  posterWidth,
  posterHeight,
  className = "",
}: {
  webm: string;
  mp4: string;
  poster: string;
  posterWidth: number;
  posterHeight: number;
  className?: string;
}) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {prefersReducedMotion ? (
        <Image
          src={poster}
          alt=""
          width={posterWidth}
          height={posterHeight}
          sizes="(min-width: 1024px) 560px, 100vw"
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={poster}
          disablePictureInPicture
        >
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
