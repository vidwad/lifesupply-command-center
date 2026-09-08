"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CommandCenterLoginLink, Eyebrow } from "@/components/public-site/lifesupply-primitives";
import {
  LIFE_SUPPLY_CONTENT,
  LIFE_SUPPLY_NAVIGATION,
  LIFE_SUPPLY_ROUTES,
} from "@/lib/public-site/lifesupply-content";

/** Routes are stored with a trailing slash; the live pathname may or may not carry one. */
function isActiveRoute(pathname: string | null, href: string) {
  const strip = (value: string) => value.replace(/\/+$/, "") || "/";
  return strip(pathname ?? "") === strip(href);
}

/**
 * Public shell: black header with the original mark and a red top rule, the
 * uppercase condensed primary navigation, the external Command Center login,
 * a charcoal footer with a matching red rule.
 *
 * The mark is rendered at its intrinsic 169×28 so next/image reserves the
 * right box; it is white on transparent and must stay on ink (docs/40).
 */
export function LifeSupplyLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { brand } = LIFE_SUPPLY_CONTENT;

  // Escape closes the mobile menu; the toggle keeps focus, so nothing is lost.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  return (
    <div className="lsh-shell min-h-screen bg-[var(--lsh-paper)] text-[var(--lsh-charcoal)]">
      <a
        href="#lsh-main"
        className="lsh-primary-action lsh-display sr-only px-4 py-2 text-[11px] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-t-4 border-white/15 border-t-[var(--lsh-brand-red)] bg-[var(--lsh-ink)] text-white shadow-lg shadow-black/25">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link
            href={LIFE_SUPPLY_ROUTES.home}
            className="flex shrink-0 items-center"
            aria-label="LifeSupply Health home"
          >
            <Image
              src={brand.image}
              alt=""
              width={brand.imageWidth}
              height={brand.imageHeight}
              className="h-8 w-auto sm:h-9"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary navigation">
            {LIFE_SUPPLY_NAVIGATION.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`lsh-display border-b-2 py-1 text-[11px] transition-colors ${
                    active
                      ? "border-[var(--lsh-brand-red)] text-white"
                      : "border-transparent text-white/75 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <CommandCenterLoginLink variant="header" />
            <Link
              href={LIFE_SUPPLY_ROUTES.investorRelations}
              className="lsh-primary-action lsh-display hidden px-4 py-2 text-[10px] transition-colors sm:inline-flex"
            >
              Investor information
            </Link>
            <button
              type="button"
              className="inline-flex p-2 text-white xl:hidden"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-controls="lsh-mobile-menu"
              aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            >
              {isMenuOpen ? (
                <X size={22} aria-hidden="true" />
              ) : (
                <Menu size={22} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <nav
            id="lsh-mobile-menu"
            className="border-t border-white/15 bg-[var(--lsh-charcoal)] px-5 py-5 xl:hidden"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto grid max-w-7xl gap-1">
              {LIFE_SUPPLY_NAVIGATION.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`lsh-display border-l-4 px-3 py-3 text-xs transition-colors ${
                      active
                        ? "border-[var(--lsh-brand-red)] bg-white/5 text-white"
                        : "border-transparent text-white/85 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href={LIFE_SUPPLY_ROUTES.investorRelations}
                onClick={() => setIsMenuOpen(false)}
                className="lsh-primary-action lsh-display mt-2 inline-flex px-3 py-3 text-xs sm:hidden"
              >
                Investor information
              </Link>
              <CommandCenterLoginLink variant="menu" />
            </div>
          </nav>
        ) : null}
      </header>

      <main id="lsh-main" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <Image
              src={brand.image}
              alt="LifeSupply Health"
              width={brand.imageWidth}
              height={brand.imageHeight}
              className="h-7 w-auto"
            />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">{brand.footerTagline}</p>
          </div>
          <div>
            <Eyebrow as="h2" tone="onDark">
              Explore
            </Eyebrow>
            <ul className="mt-4 grid gap-2">
              {LIFE_SUPPLY_NAVIGATION.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow as="h2" tone="onDark">
              Corporate office
            </Eyebrow>
            <address className="mt-4 text-sm not-italic leading-6 text-white/75">
              {brand.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/60">
          © {new Date().getFullYear()} LifeSupply Health Supplies Inc. {brand.legalNotice}
        </div>
      </footer>
    </div>
  );
}
