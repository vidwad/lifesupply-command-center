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

export function LifeSupplyLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div className="lsh-shell min-h-screen bg-[#f4f4ef] text-[#183344]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#123348] text-white shadow-lg shadow-[#071724]/20">
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
              className="h-11 w-auto"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary navigation">
            {LIFE_SUPPLY_NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-white/80 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href={LIFE_SUPPLY_ROUTES.investorRelations}
              className="hidden rounded-full border border-[#b5c951]/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#e3ed9a] transition hover:bg-[#b5c951] hover:text-[#102c3e] sm:inline-flex"
            >
              Investor information
            </Link>
            <button
              type="button"
              className="inline-flex rounded-md p-2 text-white xl:hidden"
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
            className="border-t border-white/10 px-5 py-5 xl:hidden"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto grid max-w-7xl gap-1">
              {LIFE_SUPPLY_NAVIGATION.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-md px-3 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>
      <main>{children}</main>
      <footer className="bg-[#102c3e] text-white">
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8e87f]">Explore</p>
            <div className="mt-4 grid gap-2">
              {LIFE_SUPPLY_NAVIGATION.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white/75 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8e87f]">
              Corporate office
            </p>
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
