import Image from "next/image";
import { ArrowRight, Mail, Phone, X } from "lucide-react";

import { Container, SectionHeading } from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { legacyProfile, legacyTitle, profileAnchor, team } from "@/lib/public-site/content/team";

/**
 * The team, as sections of About (product owner, 2026-09-11).
 *
 * `/our-team/` was its own page until then, with the four biographies as
 * anchored sections below the listing. About now carries the whole thing
 * under the "Since inception" band, and `/our-team/` redirects here.
 *
 * The biographies are no longer sections a reader scrolls past: a card opens
 * that person's profile as a dialog. It is driven by `:target` in CSS alone,
 * so `/about-us#david-vogt` opens David Vogt's profile with JavaScript
 * disabled, and the four legacy profile addresses still land on the person
 * rather than on the top of a listing.
 */

/**
 * Leadership and governance: one section since 2026-09-12 (product owner).
 * Abdul Ladha appeared twice on the page, once as Leadership and again as
 * the first director; he now appears once, with his full title.
 */
export function LeadershipAndGovernance() {
  const { board } = team;
  return (
    <section id="board" className="scroll-mt-24 bg-[var(--lsh-surface)] px-5 py-20 lg:px-8">
      <Container>
        <Reveal className="max-w-3xl">
          <SectionHeading
            eyebrow={team.hero.eyebrow}
            title={team.hero.title}
            description={team.hero.description}
          />
        </Reveal>
        <Stagger as="ul" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {board.map((director) => (
            <StaggerItem key={director.slug} as="li" className="h-full">
              <SpotlightCard
                as="article"
                className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]"
              >
                <a href={`#${profileAnchor(director.slug)}`} className="group flex h-full flex-col">
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
                      {director.linkLabel}{" "}
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
      </Container>
    </section>
  );
}

/** Every profile dialog, closed until its anchor is the address bar's target. */
export function ProfileDialogs() {
  return (
    <>
      {team.legacyProfiles.map((profile) => (
        <ProfileDialog key={profile.slug} slug={profile.slug} />
      ))}
    </>
  );
}

/**
 * One person's full record, as a dialog at the anchor their own page used to
 * answer on. The portrait at full height, the dated title, the preserved
 * biography, any published contact route, and the note that says where the
 * biography came from — that note is what keeps a legacy title from reading
 * as a newly confirmed one, so it travels with the biography.
 */
function ProfileDialog({ slug }: { slug: string }) {
  const profile = legacyProfile(slug);
  const headingId = `${profile.anchor}-name`;
  /**
   * Published contact routes for this person. None of the four directors has
   * a social or contact route published anywhere the site may draw on, so
   * this is empty today; the dialog renders whatever the content model holds
   * rather than inventing a channel for a real person.
   */
  const links = "links" in profile ? (profile.links as readonly ProfileLink[]) : [];
  return (
    <div
      id={profile.anchor}
      className="lsh-profile-dialog"
      role="dialog"
      aria-labelledby={headingId}
    >
      {/* Clicking the scrim closes: it is a link back to the board listing. */}
      <a href="#board" className="lsh-profile-scrim" aria-label="Close profile" />
      <div className="lsh-profile-panel relative">
        <a
          href="#board"
          className="lsh-display absolute right-4 top-4 z-10 inline-flex items-center gap-2 border border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white md:right-6 md:top-6"
        >
          Close <X size={13} aria-hidden="true" />
        </a>
        <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,17rem)_1fr] md:gap-10 md:p-10">
          <div>
            <Image
              src={profile.image}
              alt={profile.name}
              width={700}
              height={882}
              sizes="(min-width: 768px) 272px, 100vw"
              className="h-auto w-full border-t-4 border-[var(--lsh-brand-red)] object-cover"
            />
          </div>
          <div>
            <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{profile.role}</p>
            <h2
              id={headingId}
              className="lsh-display mt-2 pr-24 text-3xl text-[var(--lsh-charcoal)] sm:text-4xl"
            >
              {profile.name}
            </h2>
            <div className="mt-6 grid gap-5">
              {profile.bio.map((paragraph) => (
                <p key={paragraph} className="leading-8 text-[var(--lsh-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
            {links.length > 0 ? (
              <ul className="mt-8 flex flex-wrap gap-2 border-t border-[var(--lsh-rule)] pt-6">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                      className="lsh-display inline-flex items-center gap-1.5 border border-[var(--lsh-rule-strong)] px-3 py-2 text-[10px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
                    >
                      {link.href.startsWith("mailto:") ? (
                        <Mail size={12} aria-hidden="true" />
                      ) : link.href.startsWith("tel:") ? (
                        <Phone size={12} aria-hidden="true" />
                      ) : null}
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A published contact or social route for a person. */
type ProfileLink = { label: string; href: string };
