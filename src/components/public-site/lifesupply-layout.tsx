"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, Mail, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CommandCenterLoginLink, Eyebrow } from "@/components/public-site/lifesupply-primitives";
import { OPERATING_BRANDS, brandGeography } from "@/lib/public-site/brands";
import { LIFE_SUPPLY_CONTENT, LIFE_SUPPLY_ROUTES } from "@/lib/public-site/lifesupply-content";
import { measurementAttributes } from "@/lib/public-site/measurement";
import {
  LIFE_SUPPLY_NAVIGATION,
  buildPrimaryNavigation,
  buildLegalNavigation,
  buildUtilityNavigation,
  type NavGroup,
  type NavLink,
} from "@/lib/public-site/routes";
import { useScrollDirection } from "@/lib/public-site/use-scroll-direction";

/** Derived once from the route registry: only live destinations reach a menu. */
const PRIMARY_NAV = buildPrimaryNavigation();
const UTILITY_NAV = buildUtilityNavigation();
const LEGAL_NAV = buildLegalNavigation();

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
 *
 *   inline  header and footer lists
 *   menu    rows inside a dropdown or the mobile panel
 *
 * External destinations (the operating brands) open in a new tab and carry
 * the external icon; internal ones use next/link. `forceActive` lets a group
 * trigger show as current when one of its children is the current page.
 */
function NavItem({
  href,
  label,
  onNavigate,
  className = "",
  variant = "inline",
  external = false,
  forceActive = false,
  attributes,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
  className?: string;
  variant?: "inline" | "menu";
  external?: boolean;
  /** Inert measurement data attributes (measurement.ts); never a handler. */
  attributes?: Record<string, string>;
  forceActive?: boolean;
}) {
  const pathname = usePathname();
  const active = forceActive || (!external && isActiveRoute(pathname, href));
  const classes =
    variant === "inline"
      ? `lsh-display relative inline-flex w-fit items-center gap-1 pb-1.5 text-[11px] transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-[var(--lsh-brand-red)] after:transition-[width] after:duration-300 hover:after:w-full motion-reduce:after:transition-none ${
          active ? "text-white after:w-5" : "text-white/75 after:w-0 hover:text-white"
        } ${className}`.trim()
      : `flex items-center gap-2 border-l-2 px-4 py-2.5 text-sm transition-colors hover:bg-white/10 hover:text-white ${
          active ? "border-[var(--lsh-brand-red)] text-white" : "border-transparent text-white/80"
        } ${className}`.trim();
  const content = (
    <>
      {label}
      {external ? <ExternalLink size={12} aria-hidden="true" /> : null}
    </>
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onNavigate}
        className={classes}
        {...attributes}
      >
        {content}
      </a>
    );
  }
  return (
    <Link
      {...attributes}
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={classes}
    >
      {content}
    </Link>
  );
}

/**
 * A primary-navigation group: the trigger is a real link to the group's hub
 * page, and its dropdown lists the live children. The dropdown opens on
 * hover, on keyboard focus inside the group (so Tab reaches every row), and
 * on the chevron button for touch and assistive technology; Escape closes
 * it. No destination in a menu is ever a planned route (routes.ts).
 */
function NavGroupMenu({ group }: { group: NavGroup }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const childActive = group.links.some(
    (link) => !link.external && isActiveRoute(pathname, link.href),
  );

  if (group.links.length === 0) {
    return <NavItem href={group.href} label={group.label} />;
  }

  return (
    <div
      className="group relative flex items-center gap-1"
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <NavItem href={group.href} label={group.label} forceActive={childActive} />
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`lsh-menu-${group.key}`}
        aria-label={`${open ? "Close" : "Open"} ${group.label} menu`}
        className="grid h-6 w-6 place-items-center text-white/75 transition-colors hover:text-white"
      >
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={`lsh-menu-${group.key}`}
        className={`absolute left-0 top-full z-50 w-64 pt-4 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 motion-reduce:transition-none ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <ul className="border border-white/15 bg-[var(--lsh-charcoal)] p-2 shadow-xl shadow-black/40">
          {group.links.map((link) => (
            <li key={link.href}>
              <NavItem
                href={link.href}
                label={link.label}
                external={link.external}
                variant="menu"
                onNavigate={() => setOpen(false)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;

/**
 * Public shell.
 *
 *   - a charcoal utility strip carries contact and the external Command
 *     Center login, so the header row is navigation only;
 *   - the header hides as the visitor reads down and returns the moment they
 *     scroll up (never while the mobile menu is open, never while keyboard
 *     focus is inside it, and never near the top of the page);
 *   - primary navigation is grouped (Our Businesses / Investors / About
 *     today; further groups appear as their hub routes go live), with
 *     utility links for Shop & Services and Contact;
 *   - the mobile panel lists every group and link without a hover
 *     requirement and closes on route change;
 *   - the footer names the four operating brands with their verified links.
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

  const renderUtility = (link: NavLink, onNavigate?: () => void) => (
    <NavItem key={link.href} href={link.href} label={link.label} onNavigate={onNavigate} />
  );

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
          <nav className="flex items-center gap-5" aria-label="Utility navigation">
            <div className="hidden items-center gap-5 md:flex">
              {UTILITY_NAV.map((link) => renderUtility(link))}
            </div>
            <CommandCenterLoginLink variant="utility" />
          </nav>
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
            {PRIMARY_NAV.map((group) => (
              <NavGroupMenu key={group.key} group={group} />
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
            className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-white/15 bg-[var(--lsh-charcoal)] px-5 py-6 xl:hidden"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto grid max-w-7xl gap-6">
              {PRIMARY_NAV.map((group) => (
                <div key={group.key} className="grid justify-items-start gap-2">
                  <NavItem
                    href={group.href}
                    label={group.label}
                    onNavigate={closeMenu}
                    className="text-xs"
                  />
                  {group.links.length > 0 ? (
                    <ul className="grid w-full gap-0.5 border-l border-white/15">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <NavItem
                            href={link.href}
                            label={link.label}
                            external={link.external}
                            variant="menu"
                            onNavigate={closeMenu}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
              <div className="grid justify-items-start gap-3 border-t border-white/15 pt-5">
                {UTILITY_NAV.map((link) => renderUtility(link, closeMenu))}
                <Link
                  href={LIFE_SUPPLY_ROUTES.investorRelations}
                  onClick={closeMenu}
                  className="lsh-primary-action lsh-display mt-2 inline-flex px-4 py-3 text-xs sm:hidden"
                >
                  Investor information
                </Link>
                <CommandCenterLoginLink variant="menu" />
              </div>
            </div>
          </nav>
        ) : null}
      </header>

      <main id="lsh-main" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.8fr_1fr] lg:px-8">
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
              Operating brands
            </Eyebrow>
            <ul className="mt-5 grid justify-items-start gap-3">
              {OPERATING_BRANDS.map((record) => (
                <li key={record.key} className="grid">
                  <NavItem
                    href={record.canonicalUrl}
                    label={record.name}
                    external
                    attributes={measurementAttributes("brand_destination_click", {
                      brand: record.key,
                    })}
                  />
                  <span className="mt-1 text-[11px] text-white/50">{brandGeography(record)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow as="h2" tone="onDark">
              Explore
            </Eyebrow>
            <ul className="mt-5 grid justify-items-start gap-3">
              {[...LIFE_SUPPLY_NAVIGATION, ...UTILITY_NAV].map((item) => (
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
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_NAV.map((link) => (
              <li key={link.href}>
                <NavItem href={link.href} label={link.label} />
              </li>
            ))}
          </ul>
          <CommandCenterLoginLink variant="utility" />
        </div>
      </footer>
    </div>
  );
}
