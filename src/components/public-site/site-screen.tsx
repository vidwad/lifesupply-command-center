import Image from "next/image";

import { getSiteScreen, type SiteScreenKey } from "@/lib/public-site/site-screens";

/** Long-form capture date for the caption, without a timezone shift. */
function captureDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * A store's live home page on a laptop frame (site-screens.ts), with the
 * capture date in the caption so a reader knows it is a dated screen, not
 * the live site. Rendered through next/image at its real size.
 */
export function SiteScreen({
  site,
  sizes = "(min-width: 1024px) 560px, 100vw",
  className = "",
}: {
  site: SiteScreenKey;
  sizes?: string;
  className?: string;
}) {
  const screen = getSiteScreen(site);
  return (
    <figure className={`relative overflow-hidden bg-[var(--lsh-paper)] ${className}`.trim()}>
      <Image
        src={screen.src}
        alt={screen.alt}
        width={screen.width}
        height={screen.height}
        sizes={sizes}
        className="h-auto w-full"
      />
      <figcaption className="lsh-display absolute bottom-0 left-0 bg-black/70 px-3 py-1.5 text-[10px] text-white/80">
        {screen.host} home page, captured {captureDate(screen.capturedOn)}
      </figcaption>
    </figure>
  );
}
