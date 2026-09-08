"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";

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
 * It is decoration behind the hero copy, so the whole media layer is hidden
 * from assistive technology and carries no audio track. Two rules keep it
 * from being a nuisance rather than an atmosphere:
 *
 *   - Visitors who prefer reduced motion get the poster only. The choice is
 *     read with useSyncExternalStore, and the server snapshot is "reduced",
 *     so the server never renders a video element and nothing is fetched
 *     until the browser has said motion is welcome. Nothing is written to
 *     state from an effect.
 *   - Anyone else gets a pause control (WCAG 2.2.2: moving content that
 *     starts automatically and lasts more than five seconds must be
 *     pausable). The control sits outside the hidden media layer.
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
  const [paused, setPaused] = useState(false);

  // Act on the visitor's intent, not on the element's `paused` flag: before
  // autoplay has actually begun that flag is still true, and a click on
  // "Pause" in that window would otherwise start playback instead.
  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      void video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return (
    <>
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
      {prefersReducedMotion ? null : (
        <button
          type="button"
          onClick={togglePlayback}
          aria-pressed={paused}
          className="lsh-display absolute bottom-4 right-5 z-10 inline-flex items-center gap-1.5 border border-white/45 bg-black/55 px-3 py-1.5 text-[10px] text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-black lg:right-8"
        >
          {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
          {paused ? "Play background video" : "Pause background video"}
        </button>
      )}
    </>
  );
}
