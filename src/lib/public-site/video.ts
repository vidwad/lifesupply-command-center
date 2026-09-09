/**
 * Embedded company video for the About page.
 *
 * The site's own media is served from its own address; this one item is the
 * company's published YouTube video, and the page does not load anything
 * from YouTube until the visitor presses play. The poster is a frame from
 * the video, held locally, so the page shows nothing from a third-party
 * host before that choice. When played, the privacy-enhanced player host is
 * used. The privacy page states this behaviour.
 */
export interface EmbeddedVideo {
  /** The YouTube video id. */
  id: string;
  /** Seconds into the video where playback starts. */
  start: number;
  /** The title as published on YouTube. */
  title: string;
  poster: { src: string; alt: string; width: number; height: number };
  provenance: string;
}

export const ABOUT_VIDEO: EmbeddedVideo = {
  id: "Jb3m3Nt3S50",
  start: 12,
  title: "Lifesupply Health: Who we are & What we do",
  poster: {
    src: "/lsh/video/about-abdul-ladha-poster.jpg",
    alt: "Abdul Ladha, Chief Executive Officer, speaking in the LifeSupply Health company video.",
    width: 1280,
    height: 720,
  },
  provenance:
    "Company video published on the LifeSupply YouTube channel; the poster is the video's own title frame, held locally in greyscale. Requested by the product owner on 2026-09-09 (S-156).",
};

const EMBED_HOST = "https://www.youtube-nocookie.com";
const WATCH_HOST = "https://www.youtube.com";

/** The privacy-enhanced player address, starting where the owner asked and playing at once. */
export function youtubeEmbedUrl(video: Pick<EmbeddedVideo, "id" | "start">): string {
  const params = new URLSearchParams({
    start: String(video.start),
    autoplay: "1",
    rel: "0",
  });
  return `${EMBED_HOST}/embed/${video.id}?${params.toString()}`;
}

/** The public watch address for the same moment, for a visitor who would rather open YouTube. */
export function youtubeWatchUrl(video: Pick<EmbeddedVideo, "id" | "start">): string {
  return `${WATCH_HOST}/watch?v=${video.id}&t=${video.start}s`;
}
