import Image from "next/image";

import type { OperatingBrandKey } from "@/lib/public-site/brands";
import { BRAND_GRAPHICS, CONCEPTUAL_CAPTION, getGraphic } from "@/lib/public-site/graphics";

/**
 * The conceptual photograph for an operating brand (graphics.ts,
 * `BRAND_GRAPHICS`), in one of two presentations:
 *
 *   landscape  the 16:9 source as delivered
 *   square     the same source in a 1:1 box, cropped with the registry's
 *              crop position, for the brand cards on Home, Shop & Services,
 *              and Our Businesses
 *
 * Brand names, descriptions, and actions stay HTML beside the image; the
 * image never carries text or a logo. Inside a link the image is decorative
 * (empty alt) so the link keeps its text as its accessible name, and the
 * conceptual caption is hidden from assistive technology there because the
 * sighted reading is the only one it adds to.
 */
export function BrandImage({
  brand,
  presentation = "landscape",
  decorative = false,
  sizes = "(min-width: 1280px) 320px, (min-width: 768px) 50vw, 100vw",
  className = "",
}: {
  brand: OperatingBrandKey;
  presentation?: "landscape" | "square";
  decorative?: boolean;
  sizes?: string;
  className?: string;
}) {
  const g = getGraphic(BRAND_GRAPHICS[brand]);
  return (
    <figure
      className={`relative overflow-hidden bg-[var(--lsh-ink)] ${
        presentation === "square" ? "aspect-square" : "aspect-video"
      } ${className}`.trim()}
    >
      <Image
        src={g.src}
        alt={decorative ? "" : g.alt}
        width={g.width}
        height={g.height}
        sizes={sizes}
        style={{ objectPosition: g.position ?? "50% 50%" }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <figcaption
        aria-hidden={decorative ? "true" : undefined}
        className="lsh-display absolute bottom-0 left-0 bg-black/70 px-3 py-1.5 text-[10px] text-white/80"
      >
        {CONCEPTUAL_CAPTION}
      </figcaption>
    </figure>
  );
}
