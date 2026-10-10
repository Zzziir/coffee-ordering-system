import { clsx } from "@/lib/clsx";

/**
 * Charts for the back office reports.
 *
 * Plain HTML, CSS and SVG, rendered on the server: the data is small and the
 * marks are simple, so a charting library would cost more than it gives.
 * Hover and keyboard focus reveal a tooltip with CSS alone. Every chart here
 * plots a single series in the one accent colour; identity comes from the
 * title and the labels, never from a hue, and the colour tokens flip with the
 * dashboard's dark mode on their own.
 */

/** Round a maximum up to a clean axis top: 1, 2, 2.5 or 5 times a power of ten. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

function Tooltip({ title, lines }: { title: string; lines: string[] }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-xs)] bg-ink px-2.5 py-1.5 text-left text-[12px] leading-snug text-paper shadow-[var(--shadow-pop)] group-hover:block group-focus-visible:block"
    >
      <span className="block font-semibold">{title}</span>
      {lines.map((line) => (
        <span key={line} className="block text-paper/75">
          {line}
        </span>
      ))}
    </span>
  );
}

export type ChartPoint = {
  /** Shown under the axis for the first, middle and last points. */
  label: string;
  value: number;
  /** Tooltip heading and detail lines. */
  title: string;
  detail: string[];
};

const PLOT_HEIGHT = "h-44";

/** Which points get an axis label: the ends and the middle, never all of them. */
function labelled(index: number, count: number): boolean {
  return index === 0 || index === count - 1 || (count > 4 && index === Math.floor(count / 2));
}

function YAxis({ top, format }: { top: number; format: (value: number) => string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        PLOT_HEIGHT,
        "flex w-12 shrink-0 flex-col justify-between pr-2 text-right text-[11px] tabular-nums text-ink-faint",
      )}
    >
      <span className="-translate-y-1/2">{format(top)}</span>
      <span className="-translate-y-1/2">{format(top / 2)}</span>
      <span className="translate-y-1/2">{format(0)}</span>
    </div>
  );
}

function GridLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between">
      <span className="h-px bg-line/70" />
      <span className="h-px bg-line/70" />
      <span className="h-px bg-line-strong" />
    </div>
  );
}

function XLabels({ points }: { points: ChartPoint[] }) {
  return (
    <div aria-hidden className="ml-12 mt-2 flex text-[11px] text-ink-faint">
      {points.map((point, i) => (
        <span key={i} className="relative h-4 min-w-0 flex-1">
          {labelled(i, points.length) && (
            <span
              className={clsx(
                "absolute top-0 whitespace-nowrap",
                i === 0 ? "left-0" : i === points.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2",
              )}
            >
              {point.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

/** Columns over time: one bar per day or week. */
export function ColumnChart({
  points,
  format,
  label,
}: {
  points: ChartPoint[];
  format: (value: number) => string;
  /** What the chart shows, for screen readers. */
  label: string;
}) {
  const top = niceCeil(Math.max(...points.map((p) => p.value), 0));

  return (
    <figure aria-label={label}>
      <div className="flex">
        <YAxis top={top} format={format} />
        <div className={clsx(PLOT_HEIGHT, "relative min-w-0 flex-1")}>
          <GridLines />
          <div className="absolute inset-0 flex items-end">
            {points.map((point, i) => (
              <div
                key={i}
                tabIndex={0}
                aria-label={`${point.title}: ${point.detail.join(", ")}`}
                className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-[var(--radius-xs)] outline-none hover:bg-coffee-tint/40 focus-visible:bg-coffee-tint/60"
              >
                <span
                  className="w-full max-w-6 rounded-t-[4px] bg-coffee"
                  style={{
                    height: `${(point.value / top) * 100}%`,
                    // A day with sales never rounds down to an invisible bar.
                    minHeight: point.value > 0 ? 2 : 0,
                    marginInline: 1,
                  }}
                />
                <Tooltip title={point.title} lines={point.detail} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <XLabels points={points} />
    </figure>
  );
}

/** A running total as a line over a light wash, with the final value marked. */
export function CumulativeChart({
  points,
  format,
  label,
}: {
  points: ChartPoint[];
  format: (value: number) => string;
  label: string;
}) {
  const top = niceCeil(Math.max(...points.map((p) => p.value), 0));
  // Each point sits at the centre of its slot, matching the hover columns.
  const x = (i: number) => ((i + 0.5) / points.length) * 100;
  const y = (value: number) => 100 - (value / top) * 100;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)} 100 L${x(0)} 100 Z`;
  const last = points[points.length - 1];

  return (
    <figure aria-label={label}>
      <div className="flex">
        <YAxis top={top} format={format} />
        <div className={clsx(PLOT_HEIGHT, "relative min-w-0 flex-1")}>
          <GridLines />
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            <path d={area} className="fill-coffee/10" />
            <path
              d={line}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-coffee"
            />
          </svg>
          {/* End marker, drawn in HTML so it stays round when the plot stretches. */}
          {last && (
            <span
              aria-hidden
              className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coffee ring-2 ring-paper-raised"
              style={{ left: `${x(points.length - 1)}%`, top: `${y(last.value)}%` }}
            />
          )}
          <div className="absolute inset-0 flex">
            {points.map((point, i) => (
              <div
                key={i}
                tabIndex={0}
                aria-label={`${point.title}: ${point.detail.join(", ")}`}
                className="group relative h-full min-w-0 flex-1 rounded-[var(--radius-xs)] outline-none hover:bg-coffee-tint/40 focus-visible:bg-coffee-tint/60"
              >
                <Tooltip title={point.title} lines={point.detail} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <XLabels points={points} />
    </figure>
  );
}

export type RankRow = {
  key: string;
  label: string;
  /** Drives the bar length. */
  value: number;
  /** The figure shown at the end of the row. */
  display: string;
  /** Quieter supporting figure, e.g. a count or a share. */
  note?: string;
  /** A longer explanation, on its own line under the bar. */
  detail?: string;
};

/** Ranked horizontal bars: compare categories by length, read the value at the end. */
export function RankBars({ rows, empty }: { rows: RankRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-[14px] text-ink-soft">{empty}</p>;
  const top = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ol className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[14px] font-medium text-ink">{row.label}</span>
            <span className="shrink-0 text-[13.5px] tabular-nums text-ink">
              {row.note && <span className="mr-2 text-ink-faint">{row.note}</span>}
              <span className="font-semibold">{row.display}</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-paper-sunk">
            <div
              className="h-full rounded-full bg-coffee"
              style={{ width: `${(row.value / top) * 100}%`, minWidth: row.value > 0 ? 4 : 0 }}
            />
          </div>
          {row.detail && <p className="mt-1.5 text-[12.5px] text-ink-faint">{row.detail}</p>}
        </li>
      ))}
    </ol>
  );
}

const hourLabel = (hour: number) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "am" : "pm"}`;
};

// Opening hours are roughly 7am to midnight; start there and widen to the data.
const DEFAULT_FIRST_HOUR = 7;
const DEFAULT_LAST_HOUR = 23;

/**
 * Orders by weekday and hour. One hue, darker for busier: the eye finds the
 * rush without reading a number. Each cell names its value on hover.
 */
export function RushHeatmap({ grid, rowLabels }: { grid: number[][]; rowLabels: readonly string[] }) {
  const peak = Math.max(...grid.flat(), 0);
  const active = grid[0].map((_, hour) => grid.some((row) => row[hour] > 0));
  const first = Math.min(DEFAULT_FIRST_HOUR, ...active.flatMap((on, h) => (on ? [h] : [])));
  const last = Math.max(DEFAULT_LAST_HOUR, ...active.flatMap((on, h) => (on ? [h] : [])));
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  return (
    <figure aria-label="Orders by weekday and hour">
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          {grid.map((row, weekday) => (
            <div key={rowLabels[weekday]} className="flex items-center gap-[2px] pb-[2px]">
              <span className="w-9 shrink-0 text-[11.5px] text-ink-faint">{rowLabels[weekday]}</span>
              {hours.map((hour) => {
                const count = row[hour];
                const name = `${rowLabels[weekday]} ${hourLabel(hour)}`;
                return (
                  <span
                    key={hour}
                    tabIndex={0}
                    aria-label={`${name}: ${count} ${count === 1 ? "order" : "orders"}`}
                    className="group relative h-6 min-w-0 flex-1 rounded-[3px] bg-paper-sunk outline-none focus-visible:ring-2 focus-visible:ring-coffee"
                  >
                    {count > 0 && (
                      <span
                        className="absolute inset-0 rounded-[3px] bg-coffee"
                        // Floor the lightest step so a single order is still visible.
                        style={{ opacity: 0.18 + 0.82 * (count / peak) }}
                      />
                    )}
                    <Tooltip title={name} lines={[`${count} ${count === 1 ? "order" : "orders"}`]} />
                  </span>
                );
              })}
            </div>
          ))}
          <div aria-hidden className="mt-1 flex gap-[2px] pl-9 text-[11px] text-ink-faint">
            {hours.map((hour) => (
              <span key={hour} className="relative h-4 min-w-0 flex-1">
                {hour % 3 === 0 && <span className="absolute left-0 whitespace-nowrap">{hourLabel(hour)}</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 flex items-center gap-2 text-[11.5px] text-ink-faint">
        Fewer
        <span className="flex gap-[2px]" aria-hidden>
          {[0.18, 0.4, 0.6, 0.8, 1].map((opacity) => (
            <span key={opacity} className="size-3 rounded-[3px] bg-coffee" style={{ opacity }} />
          ))}
        </span>
        More orders
      </figcaption>
    </figure>
  );
}
