import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Eyebrow, PrimaryAction, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { legacyTitle, team } from "@/lib/public-site/content/team";
import { LIFE_SUPPLY_ROUTES, profileRoute } from "@/lib/public-site/routes";

/** `/our-team/` — titles resolve through the dated legacy profiles (S-101). */
export function TeamPage() {
  const { management, board, hero, labels } = team;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={hero.eyebrow} title={hero.title} description={hero.description} />
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <Eyebrow as="h2">{labels.management}</Eyebrow>
          <p className="text-xs text-[var(--lsh-muted)]">{labels.titlesNote}</p>
        </Reveal>
        <Stagger className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {management.map((member) => (
            <StaggerItem key={member.slug} className="h-full">
              <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                <Link href={profileRoute(member.slug)} className="group flex h-full flex-col p-7">
                  <div className="flex items-start gap-5">
                    {"image" in member ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={92}
                        height={92}
                        className="h-20 w-20 rounded-full object-cover ring-0 ring-[var(--lsh-brand-red)] transition-[box-shadow] duration-300 group-hover:ring-4 motion-reduce:transition-none"
                      />
                    ) : (
                      <div
                        className="lsh-display flex h-20 w-20 items-center justify-center rounded-full bg-[var(--lsh-surface)] text-2xl text-[var(--lsh-brand-red)] ring-0 ring-[var(--lsh-brand-red)] transition-[box-shadow] duration-300 group-hover:ring-4 motion-reduce:transition-none"
                        aria-hidden="true"
                      >
                        {member.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                    )}
                    <div>
                      <h3 className="lsh-display text-2xl text-[var(--lsh-charcoal)]">
                        {member.name}
                      </h3>
                      <p className="lsh-display mt-1 text-[10px] text-[var(--lsh-brand-red)]">
                        {legacyTitle(member.slug)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-6 leading-7 text-[var(--lsh-muted)]">{member.summary}</p>
                  <span className="lsh-display mt-auto inline-flex items-center gap-2 pt-6 text-[11px] text-[var(--lsh-brand-red)]">
                    View profile{" "}
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </span>
                </Link>
              </SpotlightCard>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-16 border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-charcoal)] p-8 text-white">
          <Eyebrow as="h2" tone="onDark">
            {labels.board}
          </Eyebrow>
          <Stagger as="ul" className="mt-6 flex flex-wrap gap-3">
            {board.map((director) => (
              <StaggerItem key={director.slug} as="li">
                <Link
                  href={profileRoute(director.slug)}
                  className="block border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:border-[var(--lsh-red-on-ink)] hover:text-white"
                >
                  {director.name}
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/[slug]/` — retained legacy profile addresses. */
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
