/**
 * Policy pages for Stage 5 (WB-507): privacy, terms, accessibility.
 *
 * Each describes what this site actually does today, verified in session on
 * 2026-09-08 against the production build: static pages served without a
 * database; no form, account, or inquiry intake; no cookie set by the site's
 * public pages; no third-party analytics or tracking script; fonts served
 * from the site's own origin; external links to the operating stores and to
 * public news sources; mailto and tel links that open the visitor's own
 * applications; a separate Command Center login for authorized staff on a
 * different host. A display-theme preference may be read from the browser's
 * local storage; the public pages offer no control that writes it.
 *
 * These pages must be updated in Stage 7 (inquiry forms, consent) and Stage 8
 * (measurement) before either goes live. They are informational statements
 * of current behaviour, not a substitute for legal review, which the
 * evidence records as pending.
 */

export interface PolicySection {
  title: string;
  paragraphs: readonly string[];
  items?: readonly string[];
}

export interface Policy {
  eyebrow: string;
  title: string;
  intro: string;
  effective: string;
  sections: readonly PolicySection[];
  /** Action-registry key for the contact step. */
  action: string;
}

const EFFECTIVE = "September 9, 2026";

export const policies = {
  privacy: {
    eyebrow: "Privacy",
    title: "What this site collects, and what it does not.",
    intro:
      "This page describes the public LifeSupply Health website as it operates today. It will be updated before any form, account, or measurement is added.",
    effective: EFFECTIVE,
    sections: [
      {
        title: "Information this site collects",
        paragraphs: [
          "The public pages do not ask for, store, or process personal information. There is no form, no account, no newsletter sign-up, and no inquiry intake on this site.",
          "The site's public pages do not set cookies, and no third-party analytics or advertising script is loaded. Fonts, images, and the site's own media are served from the site's own address.",
          "The About page carries one company video. The page shows only a locally held still until you press play; the player is then loaded from YouTube's privacy-enhanced address, and YouTube's own privacy practices apply from that point.",
          "Your browser may hold a display-theme preference in its local storage from other uses of the same address; the public pages read it if present and offer no control that writes it.",
        ],
      },
      {
        title: "Hosting and server records",
        paragraphs: [
          "Pages are served by a hosting provider that may keep ordinary server records such as the address a request came from, the page requested, and the time, for security and operation of the service. LifeSupply does not use those records to identify visitors.",
        ],
      },
      {
        title: "Contacting LifeSupply",
        paragraphs: [
          "Email and telephone links on this site open your own mail or phone application. Anything you send by email is handled by the person or team named beside the address, for the purpose of answering you. Do not send medical information, prescriptions, identity documents, or share certificates by email.",
        ],
      },
      {
        title: "Links to other sites",
        paragraphs: [
          "The operating stores (LifeSupply, Wellmart Medical, LifeSupply Clinics, and Balkowitsch Worldwide) and the public news sources linked from this site are separate websites with their own privacy practices, accounts, and cookies. This page does not describe them.",
        ],
      },
      {
        title: "Staff access",
        paragraphs: [
          "The Command Center login leads to a separate internal system on a different address, used only by authorized staff. Its handling of staff information is governed internally and is not part of this public site.",
        ],
      },
      {
        title: "Changes",
        paragraphs: [
          "When inquiry forms, consent choices, or measurement are added, this page will be revised first and its effective date updated.",
        ],
      },
    ],
    action: "general_inquiry",
  },

  terms: {
    eyebrow: "Terms of use",
    title: "How this site may be used.",
    intro:
      "These terms cover the public LifeSupply Health website. Purchases are made on the operating stores under their own terms, not here.",
    effective: EFFECTIVE,
    sections: [
      {
        title: "What this site is",
        paragraphs: [
          "This site provides corporate, operating, partner, and investor information about LifeSupply Health Inc. and the businesses it presents. It does not sell products, take orders, or process payments.",
        ],
      },
      {
        title: "Purchases and store terms",
        paragraphs: [
          "Products are sold by the operating stores, each with its own account, currency, prices, policies, returns, and support. Those stores' terms apply to any purchase; nothing on this site changes them.",
        ],
      },
      {
        title: "No medical or professional advice",
        paragraphs: [
          "Content on this site is general information. It does not diagnose, prescribe, or recommend any medication, dose, product, or treatment, and supply information is not medical advice. Decisions about care belong with a qualified clinician or pharmacist.",
        ],
      },
      {
        title: "Programs and services described as in development",
        paragraphs: [
          "Where a page says a program or service is in development, under evaluation, or proposed, it is not offered. Availability is stated only when it is confirmed, and no description on this site is an offer or a commitment.",
        ],
      },
      {
        title: "Investor information",
        paragraphs: [
          "Investor pages present reported figures with their scope and forward-looking statements with their basis. Nothing on this site is an offer to sell or a solicitation to buy any security, and no investment decision should be made on the basis of this site alone.",
        ],
      },
      {
        title: "Content and marks",
        paragraphs: [
          "Text, images, video, and marks on this site belong to LifeSupply Health Inc. or their respective owners and are provided for viewing. Operating-brand names and the news sources linked remain the property of their owners.",
        ],
      },
      {
        title: "Availability and changes",
        paragraphs: [
          "The site may change or be unavailable at any time. Effective dates on the policy pages record when their wording last changed.",
        ],
      },
    ],
    action: "general_inquiry",
  },

  accessibility: {
    eyebrow: "Accessibility",
    title: "How this site is built to be used by everyone.",
    intro:
      "LifeSupply intends the public site to be usable with a keyboard, a screen reader, and reduced-motion settings. This page states what is in place today and how to ask for help.",
    effective: EFFECTIVE,
    sections: [
      {
        title: "What is in place",
        paragraphs: ["Across the public pages:"],
        items: [
          "A skip link is the first keyboard stop on every page and lands on the main content.",
          "Every page has one main heading and a logical heading order.",
          "Menus open and close from the keyboard, with Escape to close, and the mobile menu lists every destination without needing a hover.",
          "Animation, the homepage footage, and scrolling effects are switched off when a visitor's system asks for reduced motion; the footage shows a still image instead.",
          "Keyboard focus is visible, including on red surfaces, and text is real text rather than images of text.",
          "Links say where they go, and links that leave the site are marked.",
        ],
      },
      {
        title: "Known limitations",
        paragraphs: [
          "The site has not been audited by an external accessibility reviewer. Automated accessibility checks run against every public route before it is published: one main heading per page, a heading order that never skips a level, alternative text on every image, an accessible name on every link, no horizontal scrolling at 390 pixels, and visible keyboard focus. Pages on the operating stores and the news sources linked from here are outside this statement.",
        ],
      },
      {
        title: "Getting help",
        paragraphs: [
          "If any part of this site is difficult to use, or you need information in another format, contact LifeSupply using the channel below and describe the page and the difficulty. Requests are answered by the corporate contact.",
        ],
      },
    ],
    action: "general_inquiry",
  },
} as const satisfies Record<"privacy" | "terms" | "accessibility", Policy>;

export type PolicyKey = keyof typeof policies;
