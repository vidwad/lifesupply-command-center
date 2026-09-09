"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";

import { type EmbeddedVideo, youtubeEmbedUrl } from "@/lib/public-site/video";

/**
 * A company video, embedded behind its own poster. The page renders only
 * the local poster and a play control; the third-party player is created
 * when the visitor presses play, and it is the privacy-enhanced host. So
 * the public pages still load nothing from a third party on their own, and
 * the privacy page can say exactly that.
 *
 * The control is a real button with the video's title as its name; once
 * pressed, the iframe replaces it and carries the same title.
 */
export function VideoEmbed({
  video,
  playLabel,
  className = "",
}: {
  video: EmbeddedVideo;
  playLabel: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-[var(--lsh-charcoal)] ${className}`.trim()}
    >
      {playing ? (
        <iframe
          src={youtubeEmbedUrl(video)}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`${playLabel}: ${video.title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--lsh-brand-red)]"
        >
          <Image
            src={video.poster.src}
            alt={video.poster.alt}
            width={video.poster.width}
            height={video.poster.height}
            sizes="(min-width: 1024px) 640px, 100vw"
            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--lsh-brand-red)] text-white shadow-2xl transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          >
            <Play size={30} fill="currentColor" className="ml-1" />
          </span>
          <span
            aria-hidden="true"
            className="lsh-display absolute bottom-5 left-5 right-5 text-[11px] text-white"
          >
            {playLabel}
          </span>
        </button>
      )}
    </div>
  );
}
