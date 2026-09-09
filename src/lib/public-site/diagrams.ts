/**
 * Diagrams registry for the public site.
 *
 * A diagram is generated from a section's own approved copy, so it repeats
 * what the page already says in text and never introduces a claim. Each
 * entry records its real pixel size, a descriptive alt, and where it came
 * from. The first one (2026-09-09) is Gamma's AI-infographic "hub" layout
 * rendered from the Pharmacy Solutions value block, at the product owner's
 * request to see how a smart diagram sits on the page.
 */
export interface Diagram {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Where the file came from and how it was treated. */
  provenance: string;
}

export const DIAGRAMS = {
  pharmacyCarePathway: {
    src: "/lsh/graphics/diagrams/pharmacy-care-pathway.jpg",
    alt: "Hub-and-spoke diagram: the LifeSupply supply platform (commerce, fulfilment, clinic capabilities) at the centre, connected to four nodes: for the pharmacy, for the patient, for clinic pathways, and for the group.",
    width: 1600,
    height: 900,
    provenance:
      "Gamma AI infographic (hub layout, continuous line art, Rush theme) generated 2026-09-09 from the Pharmacy Solutions value block's own copy; Gamma document kpl5it9m38lqbog; scaled from 1536×864 to 1600×900 with ffmpeg; the text in the image repeats the cards beneath it (S-160).",
  },
} as const satisfies Record<string, Diagram>;

export type DiagramKey = keyof typeof DIAGRAMS;

export function getDiagram(key: DiagramKey): Diagram {
  return DIAGRAMS[key];
}
