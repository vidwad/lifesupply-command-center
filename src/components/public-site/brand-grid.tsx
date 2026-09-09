import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { measurementAttributes } from "@/lib/public-site/measurement";

import { BrandImage } from "@/components/public-site/brand-image";
import { SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { OPERATING_BRANDS, brandGeography, type OperatingBrandKey } from "@/lib/public-site/brands";

/**
 * The four operating brands, from the brand registry. Each card opens with
 * the brand's conceptual photograph (BrandImage, decorative inside the link)
 * and sets the name in the display face: no mark is drawn until an
 * authentic one with a usage record exists for the brand (WB-207). Every
 * link is the brand's verified canonical URL, opened in a new tab because
 * it is a separate site with its own accounts and checkout.
 */
export function BrandGrid() {
  return (
    <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {OPERATING_BRANDS.map((record) => (
        <StaggerItem key={record.key} className="h-full">
          <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
            <a
              {...measurementAttributes("brand_destination_click", { brand: record.key })}
              href={record.canonicalUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col p-7"
            >
              <BrandImage
                brand={record.key as OperatingBrandKey}
                presentation="square"
                decorative
                className="-mx-7 -mt-7 mb-6"
              />
              <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                {brandGeography(record)}
              </p>
              {record.asset ? (
                <Image
                  src={record.asset.src}
                  alt={record.name}
                  width={record.asset.width}
                  height={record.asset.height}
                  className="mt-6 h-8 w-auto"
                />
              ) : (
                <h3 className="lsh-display mt-6 text-2xl text-[var(--lsh-charcoal)]">
                  {record.name}
                </h3>
              )}
              <p className="mt-3 leading-7 text-[var(--lsh-muted)]">{record.purpose}</p>
              <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] text-[var(--lsh-brand-red)]">
                Visit {record.name}{" "}
                <ExternalLink
                  size={15}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </span>
            </a>
          </SpotlightCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
