import Link from "next/link";
import { headers } from "next/headers";

import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { PublicHero } from "@/components/public-site/lifesupply-primitives";
import { isLifeSupplyPublicHost } from "@/lib/public-site/host";
import { LIFE_SUPPLY_NAVIGATION, LIFE_SUPPLY_ROUTES } from "@/lib/public-site/routes";

/**
 * Not-found page (Stage 9). On the public host it renders in the public
 * shell with the site's own navigation as the recovery path; on the
 * Command Center host it stays a plain message, because the dashboard
 * shell needs a session. A 404 is never indexed and never redirects.
 */
export default async function NotFound() {
  const host = (await headers()).get("host");
  if (!isLifeSupplyPublicHost(host)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-8 text-sm">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">
          The address does not match a Command Center page. Check the link or return to the
          dashboard.
        </p>
        <Link href="/dashboard" className="underline">
          Go to the dashboard
        </Link>
      </main>
    );
  }
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow="Page not found"
        title="That address does not exist on this site."
        description="It may have moved when the site was rebuilt, or the link may be out of date. The sections below are the current starting points."
      />
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/*
           * Contact is rendered once, below, with the emphasis that says "if
           * none of these fits". It joined LIFE_SUPPLY_NAVIGATION on
           * 2026-09-10 when it became a primary item, so it is filtered out
           * here rather than shown twice.
           */}
          {LIFE_SUPPLY_NAVIGATION.filter((item) => item.href !== LIFE_SUPPLY_ROUTES.contact).map(
            (item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="lsh-display block border border-[var(--lsh-rule)] px-5 py-4 text-[11px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ),
          )}
          <li>
            <Link
              href={LIFE_SUPPLY_ROUTES.contact}
              className="lsh-display block border border-[var(--lsh-brand-red)] px-5 py-4 text-[11px] text-[var(--lsh-brand-red)] transition-colors hover:bg-[var(--lsh-brand-red)] hover:text-white"
            >
              Contact
            </Link>
          </li>
        </ul>
      </section>
    </LifeSupplyLayout>
  );
}
