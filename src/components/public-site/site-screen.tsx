import Image from "next/image";

import { getSiteScreen, type SiteScreenKey } from "@/lib/public-site/site-screens";

/**
 * A store's live home page on a laptop frame (site-screens.ts), rendered
 * through next/image at its real size. The capture date lives in the
 * registry and the register, not on the page (product owner, 2026-09-09).
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
    </figure>
  );
}
