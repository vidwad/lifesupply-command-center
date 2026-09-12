import Image from "next/image";

import { getGraphic, type GraphicKey } from "@/lib/public-site/graphics";

/**
 * A conceptual graphic behind a page hero.
 *
 * Clinic Solutions set the pattern on 2026-09-11 with a real project
 * photograph: `PublicHero`'s media layer thins its scrim on the right, so a
 * scene shows through beside the copy while the copy keeps its contrast on
 * the left. Every other page had a black field and a red glow, which is
 * orderly and says nothing about the page (product owner). This puts a
 * registry graphic in the same place on the same terms.
 *
 * Only the conceptual registry is accepted, so the image is always greyscale,
 * always labelled conceptual in its own entry, and never a real facility or
 * person. It is decorative and hidden from assistive technology: the heading
 * carries the meaning. `position` is the CSS object-position for the hero's
 * wide-and-short crop, and defaults to the right where the scrim is thinnest.
 */
export function GraphicBackdrop({
  graphic,
  position = "70% 50%",
  dim = false,
}: {
  graphic: GraphicKey;
  position?: string;
  /**
   * For a bright scene. The hero slot is far wider than it is tall, so the
   * image is cropped top and bottom, never left and right, and a bright
   * subject cannot be moved out from under the heading; it is dimmed instead.
   */
  dim?: boolean;
}) {
  const image = getGraphic(graphic);
  return (
    <div
      aria-hidden="true"
      data-hero-graphic={graphic}
      className="lsh-graphic-backdrop absolute inset-0"
    >
      <Image
        src={image.src}
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectPosition: position }}
        className={`lsh-graphic-backdrop-image object-cover ${dim ? "opacity-50" : "opacity-80"}`}
        draggable={false}
      />
      <span className="lsh-graphic-backdrop-accent" />
    </div>
  );
}
