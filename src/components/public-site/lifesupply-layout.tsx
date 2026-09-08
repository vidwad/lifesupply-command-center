"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CommandCenterLoginLink, Eyebrow } from "@/components/public-site/lifesupply-primitives";
import {
  LIFE_SUPPLY_CONTENT,
  LIFE_SUPPLY_NAVIGATION,
  LIFE_SUPPLY_ROUTES,
} from "@/lib/public-site/lifesupply-content";
import { useScrollDirection } from "@/lib/public-site/use-scroll-direction";

/** Routes are stored with a trailing slash; the live pathname may or may not carry one. */
function isActiveRoute(pathname: string | null, href: string) {
  const strip = (value: string) => value.replace(/\/+$/, "") || "/";
  return strip(pathname ?? "") === strip(href);
}

/**
 * A navigation link with the LLD interaction: the active page carries a
 * short red bar under the first few letters rather than a rule across the
 * whole label; hovering extends the bar across the word. The link is only as
 * wide as its text, so the bar never stretches across a grid column. The
 * extension is the only motion, and it is switched off under reduced motion.
 */
function NavItem({
  href,
  label,
  onNavigate,
  className = "",
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const active = isActiveRoute(pathname, href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`lsh-display relative inline-flex w-fit items-center pb-1.5 text-[11px] transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-[var(--lsh-brand-red)] after:transition-[width] after:duration-300 hover:after:w-full motion-reduce:after:transition-none ${
        active ? "text-white after:w-5" : "text-white/75 after:w-0 hover:text-white"
      } ${className}`.trim()}
    >
      {label}
    </Link>
  );
}

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/**
 * Public shell, behaving like the LLD Recovery Academy header:
 *
 *   - a charcoal utility strip above the header carries contact and the
 *     external Command Center login, so the header row is navigation only;
 *   - the header hides as the visitor reads down and returns the moment they
 *     scroll up (never while the mobile menu is open, never while keyboard
 *     focus is inside it, and never near the top of the page);
 *   - navigation links use NavItem above; the primary action lifts on hover;
 *   - the mobile toggle is a bordered square and the panel closes on route
 *     change.
 *
 * The mark is white on transparent and must stay on ink (docs/40).
 */
export function LifeSupplyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The panel remembers the route it was opened on and is open only while
  // that is still the current route, so navigating closes it with no effect
  // and no extra render: derived state, not synchronised state.
  const [menuOpenedOn, setMenuOpenedOn] = useState<string | null>(null);
  const isMenuOpen = menuOpenedOn !== null && menuOpenedOn === pathname;
  const closeMenu = () => setMenuOpenedOn(null);
  const toggleMenu = () => setMenuOpenedOn((openedOn) => (openedOn === pathname ? null : pathname));
  const [focusWithinHeader, setFocusWithinHeader] = useState(false);
  const scrollingDown = useScrollDirection();
  const headerHidden = scrollingDown && !isMenuOpen && !focusWithinHeader;

  const { brand, contact } = LIFE_SUPPLY_CONTENT;
  const corporate = contact.channels.find((channel) => channel.label === "Corporate office");
  const investors = contact.channels.find((channel) => channel.label === "Investor relations");

  // Escape closes the mobile menu; the toggle keeps focus, so nothing is lost.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
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

      {/* Utility strip: scrolls away with the page; the header below is what sticks. */}
      <div className="border-b border-white/10 bg-[var(--lsh-charcoal)] text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-5">
            {corporate ? (
              <a
                href={`mailto:${corporate.email}`}
                className="lsh-display inline-flex items-center gap-1.5 text-[10px] text-white/80 transition-colors hover:text-white"
              >
                <Mail size={12} aria-hidden="true" /> {corporate.email}
              </a>
            ) : null}
            {investors && "phone" in investors ? (
              <a
                href={telHref(investors.phone)}
                className="lsh-display hidden items-center gap-1.5 text-[10px] text-white/80 transition-colors hover:text-white sm:inline-flex"
              >
                <Phone size={12} aria-hidden="true" /> {investors.label} {investors.phone}
              </a>
            ) : null}
          </div>
          <CommandCenterLoginLink variant="utility" />
        </div>
      </div>

      {/* Hides as the visitor reads down, returns the moment they scroll up. */}
      <header
        className={`sticky top-0 z-50 border-b border-t-4 border-white/15 border-t-[var(--lsh-brand-red)] bg-black/95 text-white shadow-lg shadow-black/25 backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none ${
          headerHidden ? "-translate-y-full" : "translate-y-0"
        }`}
        onFocusCapture={() => setFocusWithinHeader(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocusWithinHeader(false);
          }
        }}
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
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
            {LIFE_SUPPLY_NAVIGATION.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={LIFE_SUPPLY_ROUTES.investorRelations}
              className="lsh-primary-action lsh-display hidden px-4 py-2.5 text-[10px] transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:inline-flex"
            >
              Investor information
            </Link>
            <button
              type="button"
              className="inline-grid h-10 w-10 place-items-center border border-white/30 text-white transition-colors hover:border-white xl:hidden"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="lsh-mobile-menu"
              aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            >
              {isMenuOpen ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <Menu size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <nav
            id="lsh-mobile-menu"
            className="border-t border-white/15 bg-[var(--lsh-charcoal)] px-5 py-6 xl:hidden"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto grid max-w-7xl justify-items-start gap-4">
              {LIFE_SUPPLY_NAVIGATION.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onNavigate={closeMenu}
                  className="text-xs"
                />
              ))}
              <Link
                href={LIFE_SUPPLY_ROUTES.investorRelations}
                onClick={closeMenu}
                className="lsh-primary-action lsh-display mt-2 inline-flex px-4 py-3 text-xs sm:hidden"
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
            <ul className="mt-5 grid justify-items-start gap-3">
              {LIFE_SUPPLY_NAVIGATION.map((item) => (
                <li key={item.href}>
                  <NavItem href={item.href} label={item.label} />
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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-5 text-xs text-white/60 lg:px-8">
          <span>
            © {new Date().getFullYear()} LifeSupply Health Supplies Inc. {brand.legalNotice}
          </span>
          <CommandCenterLoginLink variant="utility" />
        </div>
      </footer>
    </div>
  );
}
