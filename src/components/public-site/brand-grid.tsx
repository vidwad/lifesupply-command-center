import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { measurementAttributes } from "@/lib/public-site/measurement";

import { BrandImage } from "@/components/public-site/brand-image";
import { Stagger, StaggerItem } from "@/components/public-site/motion";
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
    <Stagger className="grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
      {OPERATING_BRANDS.map((record) => (
        <StaggerItem key={record.key} className="h-full">
          <a
            {...measurementAttributes("brand_destination_click", { brand: record.key })}
            href={record.canonicalUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex h-full flex-col"
          >
            {/*
             * The photograph carries the card, so it is given a portrait crop
             * and the full column width rather than being inset inside a
             * bordered box (2026-09-10). A red keyline arrives under the image
             * on hover in place of the border that used to sit there always.
             */}
            <div className="relative overflow-hidden bg-[var(--lsh-ink)]">
              <BrandImage
                brand={record.key as OperatingBrandKey}
                presentation="portrait"
                decorative
                className="transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
            <span
              aria-hidden="true"
              className="mt-0 block h-0.5 w-full origin-left scale-x-0 bg-[var(--lsh-brand-red)] transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
            />
            <p className="lsh-display mt-5 text-[10px] text-[var(--lsh-brand-red)]">
              {brandGeography(record)}
            </p>
            {record.asset ? (
              <Image
                src={record.asset.src}
                alt={record.name}
                width={record.asset.width}
                height={record.asset.height}
                sizes="200px"
                className="mt-3 h-8 w-auto"
              />
            ) : (
              <h3 className="lsh-display mt-3 text-2xl leading-none text-[var(--lsh-charcoal)]">
                {record.name}
              </h3>
            )}
            <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{record.purpose}</p>
            <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-5 text-[11px] text-[var(--lsh-brand-red)]">
              Visit {record.name}{" "}
              <ExternalLink
                size={15}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </span>
          </a>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
