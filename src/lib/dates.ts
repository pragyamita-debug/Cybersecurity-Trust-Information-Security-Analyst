/**
 * Date-range detection for CV lines such as
 *   "Jan 2024 – Present", "03/2021 - 06/2023", "2019 to 2022", "Sept '22 — Now"
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_LABEL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTH = String.raw`(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?`;
const DATE = String.raw`(?:${MONTH}\s*,?\s*'?\d{2,4}|\d{1,2}[/.-]\d{4}|(?:19|20)\d{2})`;
const OPEN_END = String.raw`(?:present|current|currently|now|ongoing|till\s+date|to\s+date|date)`;

export const RANGE_RE = new RegExp(
  String.raw`(${DATE})\s*(?:-|–|—|to|till|until)\s*(${DATE}|${OPEN_END})`,
  'i',
);
const SINGLE_DATE_RE = new RegExp(String.raw`\b(${DATE})\b`, 'i');

export interface YM {
  y: number;
  m: number; // 0-11
}

export interface DateRange {
  start: YM;
  end: YM;
  current: boolean;
  /** the raw matched text, so callers can strip it from the line */
  raw: string;
  label: string;
}

function parseDate(token: string): YM | null {
  const t = token.trim().toLowerCase();
  const year = (s: string) => {
    const n = parseInt(s.replace(/'/g, ''), 10);
    return s.replace(/'/g, '').length === 2 ? 2000 + n : n;
  };

  const monthYear = t.match(/^([a-z]+)\.?\s*,?\s*('?\d{2,4})$/);
  if (monthYear) {
    const m = MONTHS.indexOf(monthYear[1].slice(0, 3));
    if (m >= 0) return { y: year(monthYear[2]), m };
  }
  const numeric = t.match(/^(\d{1,2})[/.-](\d{4})$/);
  if (numeric) return { y: +numeric[2], m: Math.min(11, Math.max(0, +numeric[1] - 1)) };

  const yearOnly = t.match(/^((?:19|20)\d{2})$/);
  if (yearOnly) return { y: +yearOnly[1], m: 0 };
  return null;
}

function formatYM(d: YM, hasMonth: boolean) {
  return hasMonth ? `${MONTH_LABEL[d.m]} ${d.y}` : String(d.y);
}

export function findDateRange(line: string, today = new Date()): DateRange | null {
  const match = line.match(RANGE_RE);
  if (!match) return null;
  const start = parseDate(match[1]);
  if (!start) return null;

  const openEnded = new RegExp(`^${OPEN_END}$`, 'i').test(match[2].trim());
  const end = openEnded ? { y: today.getFullYear(), m: today.getMonth() } : parseDate(match[2]);
  if (!end) return null;

  const startHasMonth = !/^(?:19|20)\d{2}$/.test(match[1].trim());
  const endHasMonth = !/^(?:19|20)\d{2}$/.test(match[2].trim());
  return {
    start,
    end,
    current: openEnded,
    raw: match[0],
    label: `${formatYM(start, startHasMonth)} – ${openEnded ? 'Present' : formatYM(end, endHasMonth)}`,
  };
}

/** A single year/month-year on its own (e.g. graduation "2022"). */
export function findSingleYear(line: string): string | undefined {
  const all = line.match(/\b(?:19|20)\d{2}\b/g);
  if (all?.length) return all[all.length - 1];
  const single = line.match(SINGLE_DATE_RE);
  return single?.[1];
}

export function monthsBetween(a: YM, b: YM) {
  return Math.max(0, (b.y - a.y) * 12 + (b.m - a.m));
}

/** Total months covered by a set of ranges, counting overlaps once. */
export function mergedMonths(ranges: Pick<DateRange, 'start' | 'end'>[]) {
  const toIdx = (d: YM) => d.y * 12 + d.m;
  const spans = ranges
    .map((r) => [toIdx(r.start), toIdx(r.end)] as const)
    .filter(([s, e]) => e >= s)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let curStart = -1;
  let curEnd = -1;
  for (const [s, e] of spans) {
    if (s > curEnd) {
      if (curEnd >= 0) total += curEnd - curStart;
      curStart = s;
      curEnd = e;
    } else {
      curEnd = Math.max(curEnd, e);
    }
  }
  if (curEnd >= 0) total += curEnd - curStart;
  return total;
}
