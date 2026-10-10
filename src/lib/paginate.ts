/** One page of a list that is already in memory. */
export type Page<T> = {
  rows: T[];
  /** 1-based, clamped into range. */
  page: number;
  pageCount: number;
  total: number;
  /** 1-based positions of the first and last row shown. 0 when empty. */
  from: number;
  to: number;
};

/**
 * Slice `rows` to the requested page. `requested` comes straight from the URL,
 * so anything that isn't a page in range falls back to the nearest real one.
 */
export function paginate<T>(rows: T[], requested: string | undefined, size: number): Page<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const parsed = Number.parseInt(requested ?? "", 10);
  const page = Math.min(pageCount, Math.max(1, Number.isNaN(parsed) ? 1 : parsed));
  const start = (page - 1) * size;
  const shown = rows.slice(start, start + size);
  return {
    rows: shown,
    page,
    pageCount,
    total,
    from: total ? start + 1 : 0,
    to: start + shown.length,
  };
}

/**
 * The page numbers to offer: the ends, the current page and its neighbours,
 * with null marking a gap. Seven slots at most, so the control never reflows.
 */
export function pageWindow(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const start = Math.max(2, Math.min(page - 1, pageCount - 4));
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5));
  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return [1, ...(start > 2 ? [null] : []), ...middle, ...(end < pageCount - 1 ? [null] : []), pageCount];
}
