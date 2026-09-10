import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Eyebrow, PrimaryAction, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { IconBadge } from "@/components/public-site/sections";
import { legacyTitle, team } from "@/lib/public-site/content/team";
import { LIFE_SUPPLY_ROUTES, profileRoute } from "@/lib/public-site/routes";

/**
 * `/our-team/` — the confirmed leader and the board as the prior site
 * listed it (product owner, 2026-09-09), with the portraits and summaries
 * copied from that site. Titles resolve through the dated legacy profiles
 * (S-101); every profile page stays at its original address.
 */
export function TeamPage() {
  const { management, board, hero, labels } = team;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={hero.eyebrow} title={hero.title} description={hero.description} />

      {/* Leadership: the single confirmed executive, at full width. */}
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-20 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-4">
            <IconBadge icon="users" size={18} />
            <Eyebrow as="h2">{labels.management}</Eyebrow>
          </div>
          <p className="text-xs text-[var(--lsh-muted)]">{labels.titlesNote}</p>
        </Reveal>
        <div className="mt-6 grid gap-5">
          {management.map((member) => (
            <Reveal key={member.slug} className="h-full">
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
                    sizes="(min-width: 1024px) 192px, 160px"
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

      {/* The board: four portrait cards in the order the prior site used. */}
      <section className="bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex items-center gap-4">
            <IconBadge icon="landmark" size={18} />
            <Eyebrow as="h2">{labels.board}</Eyebrow>
          </Reveal>
          <Stagger as="ul" className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {board.map((director) => (
              <StaggerItem key={director.slug} as="li" className="h-full">
                <SpotlightCard
                  as="article"
                  className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]"
                >
                  <Link href={profileRoute(director.slug)} className="group flex h-full flex-col">
                    <div className="relative aspect-[7/8] overflow-hidden bg-[var(--lsh-charcoal)]">
                      <Image
                        src={director.image}
                        alt={director.name}
                        width={700}
                        height={882}
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                        className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-[var(--lsh-brand-red)] transition-transform duration-500 group-hover:scale-x-100 motion-reduce:transition-none"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                        {legacyTitle(director.slug)}
                      </p>
                      <h3 className="lsh-display mt-2 text-2xl text-[var(--lsh-charcoal)]">
                        {director.name}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">
                        {director.summary}
                      </p>
                      <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-5 text-[11px] text-[var(--lsh-brand-red)]">
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
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/[slug]/` — the retained profile address: portrait, dated title, and the preserved biography. */
export function LegacyProfilePage({ slug }: { slug: string }) {
  const profile = team.legacyProfiles.find((entry) => entry.slug === slug);
  if (!profile) return null;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow="Leadership profile" title={profile.name} description={profile.role} />
      <section className="mx-auto max-w-5xl px-5 py-20 lg:px-8">
        <Reveal className="grid gap-10 border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-8 shadow-sm sm:p-12 md:grid-cols-[minmax(0,260px)_1fr]">
          <Image
            src={profile.image}
            alt={profile.name}
            width={700}
            height={882}
            sizes="(min-width: 768px) 260px, 100vw"
            className="h-auto w-full max-w-[260px] object-cover"
          />
          <div>
            <Eyebrow>Profile</Eyebrow>
            <div className="mt-6 grid gap-5">
              {profile.bio.map((paragraph) => (
                <p key={paragraph} className="text-lg leading-8 text-[var(--lsh-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
            <p className="mt-8 border-t border-[var(--lsh-rule)] pt-6 text-sm leading-6 text-[var(--lsh-muted)]">
              {team.profileNote}
            </p>
            <div className="mt-8">
              <PrimaryAction href={LIFE_SUPPLY_ROUTES.team}>Return to team</PrimaryAction>
            </div>
          </div>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}
