import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { IconBadge } from "@/components/public-site/sections";
import { AnchoredSection } from "@/components/public-site/on-this-page";
import { GraphicBackdrop } from "@/components/public-site/graphic-backdrop";
import { legacyProfile, legacyTitle, profileAnchor, team } from "@/lib/public-site/content/team";

/**
 * `/our-team/` — the confirmed leader and the board as the prior site listed
 * it (product owner, 2026-09-09), with the portraits and summaries copied
 * from that site, followed by the four full biographies.
 *
 * Each biography was its own page until 2026-09-10, when the website
 * consolidation merged them in as sections. Four addresses each held one
 * person's record with the listing above them a reader had to return to; the
 * cards now link to anchors on this page instead, and the old addresses
 * redirect to them. Titles still resolve through the dated legacy profiles
 * (S-101), and the note that says so travelled with them.
 */
export function TeamPage() {
  const { management, board, hero, labels } = team;
  return (
    <LifeSupplyLayout>
      <PublicHero
        media={<GraphicBackdrop graphic="boardroom" position="60% 50%" />}
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.description}
      />

      {/* Leadership: the single confirmed executive, at full width. */}
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-20 lg:px-8">
        {/*
         * The sourcing note that sat here ("Titles as published on the prior
         * LifeSupply website") was internal provenance shown to visitors. The
         * title itself now carries the information (round three, outcome 9).
         */}
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-4">
            <IconBadge icon="users" size={18} />
            <Eyebrow as="h2">{labels.management}</Eyebrow>
          </div>
        </Reveal>
        <div className="mt-6 grid gap-5">
          {management.map((member) => (
            <Reveal key={member.slug} className="h-full">
              <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                <a
                  href={`#${profileAnchor(member.slug)}`}
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
                      Read full profile{" "}
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                      />
                    </span>
                  </div>
                </a>
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
                  <a
                    href={`#${profileAnchor(director.slug)}`}
                    className="group flex h-full flex-col"
                  >
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
                        Read full profile{" "}
                        <ArrowRight
                          size={15}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                        />
                      </span>
                    </div>
                  </a>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/*
       * The four biographies, each at the anchor its own page used to answer
       * on. A reader who follows a card no longer leaves the page and has to
       * come back to compare one director with another.
       */}
      <section className="mx-auto max-w-7xl px-5 pt-20 lg:px-8">
        <Reveal className="flex items-center gap-4">
          <IconBadge icon="users" size={18} />
          <Eyebrow as="h2">{labels.profiles}</Eyebrow>
        </Reveal>
      </section>
      {team.legacyProfiles.map((profile) => (
        <ProfileSection key={profile.slug} slug={profile.slug} />
      ))}
    </LifeSupplyLayout>
  );
}

/**
 * One person's full record (`#<anchor>`), absorbed from their own page on
 * 2026-09-10.
 *
 * The portrait, the dated title, the preserved biography and the note that
 * says where it came from all travelled together: the note is what keeps a
 * legacy title from reading as a newly confirmed one, so it cannot be left
 * behind when the biography moves.
 */
function ProfileSection({ slug }: { slug: string }) {
  const profile = legacyProfile(slug);
  return (
    <AnchoredSection
      id={profile.anchor}
      className="border-t border-[var(--lsh-rule)] px-5 py-16 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[minmax(0,240px)_1fr]">
        <Reveal>
          <Image
            src={profile.image}
            alt={profile.name}
            width={700}
            height={882}
            sizes="(min-width: 768px) 240px, 100vw"
            className="h-auto w-full max-w-[240px] object-cover"
          />
        </Reveal>
        <Reveal delay={0.05}>
          <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{profile.role}</p>
          <h3 className="lsh-display mt-2 text-3xl text-[var(--lsh-charcoal)]">{profile.name}</h3>
          <div className="mt-6 grid gap-5">
            {profile.bio.map((paragraph) => (
              <p key={paragraph} className="leading-8 text-[var(--lsh-muted)]">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-8 border-t border-[var(--lsh-rule)] pt-6 text-sm leading-6 text-[var(--lsh-muted)]">
            {team.profileNote}
          </p>
        </Reveal>
      </div>
    </AnchoredSection>
  );
}
