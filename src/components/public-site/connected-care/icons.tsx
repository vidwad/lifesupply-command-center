/**
 * The six icons of the Connected Care diagram, drawn here so their stroke
 * weight, scale and manner match one another (product owner, 2026-09-13).
 * Each is a 24-unit outline at a 1.5 stroke, decorative and hidden from
 * assistive technology: the heading beside it carries the meaning.
 *
 *   patient      a person symbol, no age, no treatment
 *   supplies     a package with a small cross on its face
 *   clinic       a room outline with a door swing and a bench
 *   care         a clinician: head, shoulders and a stethoscope loop
 *   pharmacy     a container with an Rx mark and a cap
 *   technology   four connected points around a centre
 */
export type DiagramIconName =
  | "patient"
  | "supplies"
  | "clinic"
  | "care"
  | "pharmacy"
  | "technology";

const PATHS: Record<DiagramIconName, React.ReactNode> = {
  patient: (
    <>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 19.5c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    </>
  ),
  supplies: (
    <>
      <path d="M3.5 8.5 12 4.5l8.5 4v8l-8.5 4-8.5-4v-8Z" />
      <path d="M3.5 8.5 12 12.5l8.5-4M12 12.5v8" />
      <path d="M7.25 10.75v-2.1M6.2 9.7h2.1" />
    </>
  ),
  clinic: (
    <>
      <path d="M4 20V5.5h16V20" />
      <path d="M4 20h16M9 20v-4.5M9 15.5a4 4 0 0 1 4 4" />
      <path d="M13.5 9.5h4v3h-4zM6.5 9.5h3" />
    </>
  ),
  care: (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M6 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M8.5 14.5v2a3.5 3.5 0 0 0 7 0v-2" />
      <circle cx="15.5" cy="18.5" r="1.25" />
    </>
  ),
  pharmacy: (
    <>
      <path d="M8 4.5h8v2.5H8z" />
      <path d="M8.5 7v11.5a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5V7" />
      <path d="M10.75 11h1.6a1.1 1.1 0 0 1 0 2.2h-1.6V11Zm0 2.2 2.5 3.1M13.75 13.9l-2 2.4" />
    </>
  ),
  technology: (
    <>
      <circle cx="12" cy="12" r="2" />
      <circle cx="5" cy="6" r="1.5" />
      <circle cx="19" cy="6" r="1.5" />
      <circle cx="5" cy="18" r="1.5" />
      <circle cx="19" cy="18" r="1.5" />
      <path d="m6.2 7.1 4.3 3.5M17.8 7.1l-4.3 3.5M6.2 16.9l4.3-3.5M17.8 16.9l-4.3-3.5" />
    </>
  ),
};

export function DiagramIcon({
  name,
  size = 24,
  className = "",
}: {
  name: DiagramIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
