/**
 * Photographs of completed LifeSupply Clinics projects.
 *
 * This is the opposite of `graphics.ts`, and the two must never be mixed.
 * Everything in that registry is generated, conceptual, and forbidden from
 * being presented as a real facility. Everything here is a real photograph of
 * a real finished clinic, taken from the project's own published page on
 * lifesupplyclinics.com, and its whole value is that it is real.
 *
 * Each entry names the published page it came from, so every fact the site
 * states beside the picture — clinic type, city, floor area, build year — can
 * be checked against the source that published it. Nothing here is inferred.
 *
 * Added 2026-09-11. Clinic Solutions illustrated six clinic projects with a
 * laptop showing the LifeSupply Clinics website, which demonstrates that
 * another website exists rather than the quality of the work (product owner).
 *
 * Rules, matching `docs/website-asset-manifest.md`:
 *
 *   - Greyscale, in keeping with the black, white and red identity.
 *   - No person appears in any of them, so none can be read as staff,
 *     a patient, or a customer.
 *   - Alt text describes the room, never the brand and never a person.
 *   - A registry test checks the declared size, the file weight, the source
 *     URL, and that nothing here is ever described as conceptual.
 */

const PROVENANCE =
  "Photograph of the completed project as published by LifeSupply Clinics on the project page named in `source`; copied 2026-09-11, converted to neutral greyscale and scaled to 1600×900 with ffmpeg, no red treatment. Real photography of a real completed facility; no person appears in it.";

export interface ProjectPhotograph {
  src: string;
  /** Describes the room. Never a brand, never a person. */
  alt: string;
  width: number;
  height: number;
  /** The published project page the photograph and its stated facts come from. */
  source: string;
  provenance: string;
}

export const PROJECT_PHOTOGRAPHS = {
  burnaby: {
    src: "/lsh/graphics/projects/clinic-burnaby.jpg",
    alt: "A curved clinic reception desk with a slatted timber front and a matching suspended ceiling feature.",
    width: 1600,
    height: 900,
    source: "https://www.lifesupplyclinics.com/portfolio/medical-clinic-construction-in-burnaby/",
    provenance: PROVENANCE,
  },
  abbotsford: {
    src: "/lsh/graphics/projects/clinic-abbotsford.jpg",
    alt: "A clinic reprocessing room with stainless steel counters, an autoclave and closed cabinetry along both walls.",
    width: 1600,
    height: 900,
    source: "https://www.lifesupplyclinics.com/portfolio/ent-clinic-construction-in-abbotsford/",
    provenance: PROVENANCE,
  },
  vancouverMedical: {
    src: "/lsh/graphics/projects/clinic-vancouver-medical.jpg",
    alt: "A clinic corridor seen across a reception counter, with treatment room doorways along one side and supply trolleys in a recess.",
    width: 1600,
    height: 900,
    source: "https://www.lifesupplyclinics.com/portfolio/medical-clinic-design-build-in-vancouver/",
    provenance: PROVENANCE,
  },
} as const satisfies Record<string, ProjectPhotograph>;

export type ProjectPhotographKey = keyof typeof PROJECT_PHOTOGRAPHS;

export function getProjectPhotograph(key: ProjectPhotographKey): ProjectPhotograph {
  return PROJECT_PHOTOGRAPHS[key];
}
