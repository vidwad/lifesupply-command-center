/**
 * The one demographic graphic on Medical Supply Solutions (product owner,
 * 2026-09-13): people aged 65 and older, in Canada and the United States.
 *
 * Drawn in HTML and CSS from figures recorded in
 * `docs/website-content-evidence.md`, so every bar is a published statistic
 * with its geography, year and source beside it, and every value is real
 * text rather than a picture of a number. Historical measures are solid
 * bars; the projection is a dashed outline with no figure in it, because
 * the only projected fact published here is the direction. Nothing on the
 * chart is a market size, a growth rate for medical supplies, or a forecast
 * of the business, and the qualification under it says so.
 */
interface Point {
  year: string;
  value: number;
  kind: "historical";
}

interface Series {
  geography: string;
  measure: string;
  unit: string;
  points: readonly Point[];
  note: string;
  projection?: { label: string; text: string };
}

export interface DemographicChartData {
  title: string;
  canada: Series;
  us: Series;
  legend: { historical: string; projection: string };
  sources: string;
  qualification: string;
}

/** A bar's width, as a share of the panel; the scale is per series. */
function width(value: number, max: number) {
  return `${Math.round((value / max) * 100)}%`;
}

function Panel({ series }: { series: Series }) {
  // Headroom above the largest bar, so a projection outline has somewhere
  // to go and the largest historical bar does not touch the edge.
  const max = Math.max(...series.points.map((point) => point.value)) * 1.25;
  const last = series.points[series.points.length - 1];
  return (
    <div>
      <p className="lsh-display text-[11px] text-[var(--lsh-red-on-ink)]">{series.geography}</p>
      <p className="mt-2 text-sm leading-6 text-white/75">{series.measure}</p>
      <dl className="mt-5 grid gap-3">
        {series.points.map((point) => (
          <div key={point.year} className="grid grid-cols-[4.75rem_1fr_4.5rem] items-center gap-3">
            <dt className="lsh-display text-[11px] text-white/70">{point.year}</dt>
            <dd className="m-0">
              <span
                aria-hidden="true"
                className="block h-5 bg-white/90"
                style={{ width: width(point.value, max) }}
              />
            </dd>
            <dd className="lsh-display m-0 text-right text-sm tabular-nums text-white">
              {series.unit === "%" ? point.value.toFixed(1) : point.value}
              <span className="ml-0.5 text-[10px] text-white/70">
                {series.unit === "%" ? "%" : ` ${series.unit}`}
              </span>
            </dd>
          </div>
        ))}
        {series.projection && last ? (
          <div className="grid grid-cols-[4.75rem_1fr_4.5rem] items-center gap-3">
            <dt className="lsh-display text-[11px] leading-tight text-white/70">
              {series.projection.label}
            </dt>
            <dd className="m-0">
              {/* The outline starts where the last measure ends and runs on
                  without a figure: a direction, not a number. */}
              <span
                aria-hidden="true"
                className="block h-5 border border-dashed border-white/70"
                style={{ width: width(last.value * 1.15, max) }}
              />
            </dd>
            <dd className="lsh-display m-0 text-right text-[10px] leading-tight text-white/70">
              rising
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-xs leading-5 text-white/60">{series.note}</p>
      {series.projection ? (
        <p className="mt-1 text-xs leading-5 text-white/60">{series.projection.text}</p>
      ) : null}
    </div>
  );
}

export function DemographicChart({ data }: { data: DemographicChartData }) {
  return (
    <figure className="border border-white/15 p-6 sm:p-8">
      <figcaption className="lsh-display text-lg leading-tight text-white">{data.title}</figcaption>
      <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-8">
        <Panel series={data.canada} />
        <Panel series={data.us} />
      </div>
      <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/15 pt-5 text-xs text-white/70">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-3 w-6 bg-white/90" />
          {data.legend.historical}
        </li>
        <li className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-6 border border-dashed border-white/70"
          />
          {data.legend.projection}
        </li>
      </ul>
      <p className="mt-4 text-xs leading-5 text-white/55">{data.sources}</p>
      <p className="mt-2 text-xs leading-5 text-white/70">{data.qualification}</p>
    </figure>
  );
}
