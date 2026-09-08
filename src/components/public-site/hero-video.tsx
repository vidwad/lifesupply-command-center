"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * The homepage hero's background footage: the legacy lifesupplyhealth.com
 * hero video, cut down to its caption-free scenes, desaturated, and looped.
 *
 * It is decoration behind the hero copy, so the whole layer is hidden from
 * assistive technology and carries no audio track. Visitors who prefer
 * reduced motion get the poster only: the preference is read with
 * useSyncExternalStore, and the server snapshot is "reduced", so the server
 * never renders a video element and nothing is fetched until the browser
 * has said motion is welcome.
 *
 * There is no on-screen playback control, by product-owner decision
 * (2026-09-08). The loop pauses itself while the hero is scrolled out of
 * view, which keeps the decoder idle for the rest of the page.
 *
 * WebM is listed first because every evergreen browser decodes VP9, and the
 * MP4 is the H.264 fallback.
 */
export function HeroVideo({
  webm,
  mp4,
  poster,
  posterWidth,
  posterHeight,
}: {
  webm: string;
  mp4: string;
  poster: string;
  posterWidth: number;
  posterHeight: number;
}) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play only while on screen. No state is involved: the observer drives
  // the element directly.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) void video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: 0.05 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {prefersReducedMotion ? (
        <Image
          src={poster}
          alt=""
          width={posterWidth}
          height={posterHeight}
          sizes="100vw"
          className="h-full w-full object-cover"
          priority
        />
      ) : (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
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
