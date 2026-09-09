import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Eyebrow, PrimaryAction, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard } from "@/components/public-site/motion";
import { IconBadge } from "@/components/public-site/sections";
import { legacyTitle, team } from "@/lib/public-site/content/team";
import { LIFE_SUPPLY_ROUTES, profileRoute } from "@/lib/public-site/routes";

/**
 * `/our-team/` — current leadership as confirmed by the company (2026-09-08).
 * Titles resolve through the dated legacy profiles (S-101); the profile page
 * stays at its original address.
 */
export function TeamPage() {
  const { management, hero, labels } = team;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={hero.eyebrow} title={hero.title} description={hero.description} />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-4">
            <IconBadge icon="users" size={18} />
            <Eyebrow as="h2">{labels.management}</Eyebrow>
          </div>
          <p className="text-xs text-[var(--lsh-muted)]">{labels.titlesNote}</p>
        </Reveal>
        <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {management.map((member) => (
            <Reveal key={member.slug} className="h-full lg:col-span-2">
              <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                <Link
                  href={profileRoute(member.slug)}
                  className="group grid h-full gap-8 p-8 md:grid-cols-[auto_1fr] md:items-center lg:p-10"
                >
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={200}
                    height={200}
                    className="h-40 w-40 rounded-full object-cover ring-0 ring-[var(--lsh-brand-red)] transition-[box-shadow] duration-300 group-hover:ring-4 motion-reduce:transition-none lg:h-48 lg:w-48"
                  />
                  <div>
                    <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                      {legacyTitle(member.slug)}
                    </p>
                    <h3 className="lsh-display mt-2 text-3xl text-[var(--lsh-charcoal)] sm:text-4xl">
                      {member.name}
                    </h3>
                    <p className="mt-4 max-w-2xl leading-7 text-[var(--lsh-muted)]">
                      {member.summary}
                    </p>
                    <span className="lsh-display mt-6 inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                      View profile{" "}
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </span>
                  </div>
                </Link>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/[slug]/` — the retained profile address. */
export function LegacyProfilePage({ slug }: { slug: string }) {
  const profile = team.legacyProfiles.find((entry) => entry.slug === slug);
  if (!profile) return null;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow="Leadership profile" title={profile.name} description={profile.role} />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <Reveal className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-8 shadow-sm sm:p-12">
          <Eyebrow>Profile</Eyebrow>
          <p className="mt-6 text-lg leading-8 text-[var(--lsh-muted)]">{profile.bio}</p>
          <p className="mt-8 border-t border-[var(--lsh-rule)] pt-6 text-sm leading-6 text-[var(--lsh-muted)]">
            {team.profileNote}
          </p>
          <div className="mt-8">
            <PrimaryAction href={LIFE_SUPPLY_ROUTES.team}>Return to team</PrimaryAction>
          </div>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}
