"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import {
  LIFE_SUPPLY_CONTENT,
  LIFE_SUPPLY_NAVIGATION,
  LIFE_SUPPLY_ROUTES,
} from "@/lib/public-site/lifesupply-content";
import { getCommandCenterLoginUrl } from "@/lib/public-site/command-center";

export function LifeSupplyLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const commandCenterLoginUrl = getCommandCenterLoginUrl();

  return (
    <div className="lsh-shell min-h-screen bg-[var(--lsh-paper)] text-[var(--lsh-charcoal)]">
      <header className="sticky top-0 z-50 border-b border-t-4 border-white/15 border-t-[var(--lsh-brand-red)] bg-[var(--lsh-ink)] text-white shadow-lg shadow-black/25">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link
            href={LIFE_SUPPLY_ROUTES.home}
            className="flex items-center"
            aria-label="LifeSupply Health home"
          >
            <Image
              src={LIFE_SUPPLY_CONTENT.brand.image}
              alt="LifeSupply Health"
              width={184}
              height={50}
              className="h-10 w-auto sm:h-11"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary navigation">
            {LIFE_SUPPLY_NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="lsh-display text-[11px] text-white/75 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={commandCenterLoginUrl}
              className="lsh-display hidden border border-white/45 px-4 py-2 text-[10px] text-white transition-colors hover:border-white hover:bg-white hover:text-black sm:inline-flex"
            >
              Command Center login
            </a>
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
              aria-label="Toggle navigation"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
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
              {LIFE_SUPPLY_NAVIGATION.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="lsh-display px-3 py-3 text-xs text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={commandCenterLoginUrl}
                className="lsh-display mt-2 border border-white/30 px-3 py-3 text-xs text-white transition-colors hover:bg-white hover:text-black"
              >
                Command Center login
              </a>
            </div>
          </nav>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="bg-[var(--lsh-charcoal)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <Image
              src={LIFE_SUPPLY_CONTENT.brand.image}
              alt="LifeSupply Health"
              width={180}
              height={48}
              className="h-11 w-auto"
            />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
              Corporate information, operating context, and investor resources from LifeSupply
              Health Supplies Inc.
            </p>
          </div>
          <div>
            <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">Explore</p>
            <div className="mt-4 grid gap-2">
              {LIFE_SUPPLY_NAVIGATION.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white/75 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="lsh-display text-[11px] text-[var(--lsh-brand-red)]">Corporate office</p>
            <address className="mt-4 text-sm not-italic leading-6 text-white/75">
              {LIFE_SUPPLY_CONTENT.brand.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/45">
          © {new Date().getFullYear()} LifeSupply Health Supplies Inc. Public information is subject
          to update and applicable disclosure context.
        </div>
      </footer>
    </div>
  );
}
