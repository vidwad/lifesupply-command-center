"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, Mail, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CommandCenterLoginLink, Eyebrow } from "@/components/public-site/lifesupply-primitives";
import { ScrollToTop } from "@/components/public-site/scroll-to-top";
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
  neverCurrent = false,
  attributes,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
  className?: string;
  /**
   * inline: menu item with the red rule, used in the footer and the mobile
   * panel; primary: the same item one step larger, for the desktop header
   * only (product owner, 2026-09-12); utility: strip link, colour change
   * only; menu: dropdown row.
   */
  variant?: "inline" | "primary" | "utility" | "menu";
  external?: boolean;
  /** Inert measurement data attributes (measurement.ts); never a handler. */
  attributes?: Record<string, string>;
  forceActive?: boolean;
  /** An "Overview" row repeats the group's own destination; it never claims aria-current. */
  neverCurrent?: boolean;
}) {
  const pathname = usePathname();
  const active = !neverCurrent && (forceActive || (!external && isActiveRoute(pathname, href)));
  const classes =
    variant === "inline" || variant === "primary"
      ? `lsh-display relative inline-flex w-fit items-center gap-1 py-1.5 ${
          variant === "primary" ? "text-[13px]" : "text-[11px]"
        } transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-[var(--lsh-brand-red)] after:transition-[width] after:duration-300 hover:after:w-full motion-reduce:after:transition-none ${
          active ? "text-white after:w-5" : "text-white/75 after:w-0 hover:text-white"
        } ${className}`.trim()
      : variant === "utility"
        ? `lsh-display inline-flex w-fit items-center gap-1 py-1.5 text-[11px] transition-colors ${
            active ? "text-white" : "text-white/75 hover:text-white"
          } ${className}`.trim()
        : `flex items-center gap-2 border-l-2 px-4 py-1.5 text-sm transition-colors hover:bg-white/10 hover:text-white ${
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
 *
 * A group with no hub — Solutions since 2026-09-10 — has no page to link to,
 * so the label itself becomes the disclosure button rather than a link that
 * goes nowhere, and the panel has no "Overview" row. It is still reachable by
 * keyboard and by touch, and still never depends on hover.
 */
function NavGroupMenu({ group }: { group: NavGroup }) {
  const pathname = usePathname();
  // The menu ends at the page's right edge, so the last group's panel opens
  // leftward; every other panel is left-aligned under its trigger. Investors
  // is the last group with a dropdown, so its panel opens leftward.
  const panelAlign = group.key === "investors" ? "right-0" : "left-0";
  const [open, setOpen] = useState(false);
  const childActive = group.links.some(
    (link) => !link.external && isActiveRoute(pathname, link.href),
  );

  if (group.links.length === 0) {
    // A group with neither children nor a hub cannot render anything; the
    // registry does not produce one, and this keeps that true by construction.
    return group.href === null ? null : (
      <NavItem href={group.href} label={group.label} variant="primary" />
    );
  }

  return (
    <div
      className="group relative flex items-center"
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      {group.href === null ? null : (
        <NavItem
          href={group.href}
          label={group.label}
          variant="primary"
          forceActive={childActive}
        />
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={`lsh-menu-${group.key}`}
        aria-label={
          group.href === null
            ? `${open ? "Close" : "Open"} ${group.label} menu`
            : `${open ? "Close" : "Open"} ${group.label} menu`
        }
        className={
          group.href === null
            ? `lsh-display inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] transition-colors ${
                childActive ? "text-white" : "text-white/75 hover:text-white"
              }`
            : "-mr-1 grid h-6 w-5 place-items-center text-white/75 transition-colors hover:text-white"
        }
      >
        {group.href === null ? group.label : null}
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={`lsh-menu-${group.key}`}
        className={`absolute top-full z-50 w-64 ${panelAlign} pt-4 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 motion-reduce:transition-none ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <ul className="border border-white/15 bg-[var(--lsh-charcoal)] p-2 shadow-xl shadow-black/40">
          {/* The group's own page, so a visitor who goes straight to the dropdown does not miss it. */}
          {group.href === null ? null : (
            <li>
              <NavItem
                href={group.href}
                label="Overview"
                variant="menu"
                neverCurrent
                onNavigate={() => setOpen(false)}
              />
            </li>
          )}
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
 *   - every dropdown and every expanded mobile group opens with an
 *     "Overview" row to the group's own page (product owner, 2026-09-09);
 *   - the mobile panel lists every group and link without a hover
 *     requirement, keeps its groups collapsed (one open at a time, the
 *     current page's group open first) so it fits a phone screen, and closes
 *     on route change;
 *   - a back-to-top control appears bottom right once the visitor has read
 *     down (scroll-to-top.tsx);
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
  // The panel keeps its groups collapsed so the list fits a phone screen;
  // one group is open at a time, and opening the panel expands the group
  // that holds the current page.
  const activeGroup = PRIMARY_NAV.find(
    (group) =>
      (group.href !== null && isActiveRoute(pathname, group.href)) ||
      group.links.some((link) => !link.external && isActiveRoute(pathname, link.href)),
  );
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const toggleMenu = () => {
    setExpandedGroup(activeGroup?.key ?? null);
    setMenuOpenedOn((openedOn) => (openedOn === pathname ? null : pathname));
  };
  const toggleGroup = (key: string) =>
    setExpandedGroup((current) => (current === key ? null : key));
  const [focusWithinHeader, setFocusWithinHeader] = useState(false);
  const scrollingDown = useScrollDirection();
  const headerHidden = scrollingDown && !isMenuOpen && !focusWithinHeader;

  const { brand, contact, homepage } = LIFE_SUPPLY_CONTENT;
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

  // The inline NavItem reserves 6px below its text for the hover underline;
  // in the 36px utility strip that reads as sitting high, so pull it back.
  const renderUtility = (link: NavLink, onNavigate?: () => void) => (
    <NavItem
      key={link.href}
      href={link.href}
      label={link.label}
      variant="utility"
      onNavigate={onNavigate}
      className=""
    />
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
          </nav>
        </div>
      </div>

      {/* Hides as the visitor reads down, returns the moment they scroll up. */}
      <header
        className={`sticky top-0 z-50 border-b border-t-2 border-white/15 border-t-[var(--lsh-brand-red)] bg-black/95 text-white shadow-lg shadow-black/25 backdrop-blur-md transition-transform duration-300 ease-out motion-reduce:transition-none ${
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

          <nav
            /*
             * The row centres both boxes, but the logo is a lockup: its
             * triangle mark rises well above the LIFESUPPLY wordmark, so the
             * wordmark's cap block sits in the lower part of the image. Its
             * centre measures at 70.4% of the logo's height, not 50%, which
             * left the menu reading about 7px high. The nudge puts the menu's
             * caps on the wordmark's optical line (product owner, 2026-09-12).
             */
            className="hidden translate-y-[7px] items-center justify-end gap-3.5 xl:flex xl:flex-1 2xl:gap-5"
            aria-label="Primary navigation"
          >
            {PRIMARY_NAV.map((group) => (
              <NavGroupMenu key={group.key} group={group} />
            ))}
          </nav>

          <div className="flex items-center gap-3 xl:hidden">
            <button
              type="button"
              className="inline-grid h-10 w-10 place-items-center border border-white/30 text-white transition-colors hover:border-white"
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
            className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-white/15 bg-[var(--lsh-charcoal)] px-5 py-4 xl:hidden"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto grid max-w-7xl gap-1.5">
              {PRIMARY_NAV.map((group) => (
                <div key={group.key} className="grid gap-1">
                  <div className="flex items-center justify-between gap-4">
                    {/*
                     * Solutions has no page of its own, so its label is a
                     * button that opens the group rather than a link that
                     * goes nowhere. It is styled as the other labels are, and
                     * it keeps the same bordered chevron beside it, so every
                     * row in the panel reads the same way (product owner,
                     * 2026-09-11).
                     */}
                    {group.href === null ? (
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        aria-expanded={expandedGroup === group.key}
                        aria-controls={`lsh-mobile-group-${group.key}`}
                        className="lsh-display text-left text-xs text-white/75 transition-colors hover:text-white"
                      >
                        {group.label}
                      </button>
                    ) : (
                      <NavItem
                        href={group.href}
                        label={group.label}
                        onNavigate={closeMenu}
                        className="text-xs"
                      />
                    )}
                    {group.links.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        aria-expanded={expandedGroup === group.key}
                        aria-controls={`lsh-mobile-group-${group.key}`}
                        aria-label={`${expandedGroup === group.key ? "Collapse" : "Expand"} ${group.label}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-white/20 text-white/80 transition-colors hover:border-white hover:text-white"
                      >
                        <ChevronDown
                          size={16}
                          aria-hidden="true"
                          className={`transition-transform duration-300 motion-reduce:transition-none ${
                            expandedGroup === group.key ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    ) : null}
                  </div>
                  {group.links.length > 0 ? (
                    <ul
                      id={`lsh-mobile-group-${group.key}`}
                      className={
                        expandedGroup === group.key
                          ? "grid w-full gap-0.5 border-l border-white/15"
                          : "hidden"
                      }
                    >
                      {group.href === null ? null : (
                        <li>
                          <NavItem
                            href={group.href}
                            label="Overview"
                            variant="menu"
                            neverCurrent
                            onNavigate={closeMenu}
                          />
                        </li>
                      )}
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
              <div className="mt-2 grid justify-items-start gap-2 border-t border-white/15 pt-4">
                {UTILITY_NAV.map((link) => renderUtility(link, closeMenu))}
              </div>
            </div>
          </nav>
        ) : null}
      </header>

      <main id="lsh-main" tabIndex={-1}>
        {children}
      </main>
      <ScrollToTop />

      <footer className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.8fr_1fr] lg:px-8">
          <div>
            <Image
              src={brand.image}
              alt="LifeSupply Health"
              width={brand.imageWidth}
              height={brand.imageHeight}
              sizes="220px"
              className="h-7 w-auto"
            />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">{brand.footerTagline}</p>
            {/*
             * What the group is, under the tagline (product owner,
             * 2026-09-12). Rendered from the homepage hero's own sentence
             * rather than a second copy of it, so the two cannot drift.
             */}
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">{homepage.description}</p>
          </div>
          <div>
            <Eyebrow as="h2" tone="onDark">
              Operating brands
            </Eyebrow>
            <ul className="mt-4 grid justify-items-start gap-1.5">
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
                  <span className="-mt-0.5 text-[11px] leading-4 text-white/50">
                    {brandGeography(record)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow as="h2" tone="onDark">
              Explore
            </Eyebrow>
            <ul className="mt-4 grid justify-items-start gap-1">
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
            © {new Date().getFullYear()} LifeSupply Health Inc. {brand.legalNotice}
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
