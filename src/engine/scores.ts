import type { Activity, RatingKey } from './types';

export const RATINGS: { key: RatingKey; label: string; question: string; low: string; high: string }[] = [
  { key: 'enjoyment', label: 'Enjoyment', question: 'How much do you enjoy it while doing it?', low: 'Meh', high: 'Love it' },
  { key: 'anticipation', label: 'Anticipation', question: 'How much do you look forward to it?', low: 'Not at all', high: 'Can’t wait' },
  { key: 'afterglow', label: 'Afterwards', question: 'How do you feel once it’s over?', low: 'Drained', high: 'Glowing' },
  { key: 'effort', label: 'Effort', question: 'How much effort does it take to actually do?', low: 'Effortless', high: 'Demanding' },
];

/** Setup + session + teardown. */
export function totalMinutes(a: Activity): number {
  return a.setup + a.duration + a.teardown;
}

export function overheadMinutes(a: Activity): number {
  return a.setup + a.teardown;
}

/**
 * What an activity gives back, 1 to 5. How you feel afterwards counts double,
 * because lasting enjoyment is the thing this app is trying to surface.
 */
export function value(a: Activity): number {
  return (a.enjoyment + a.anticipation + 2 * a.afterglow) / 4;
}

export const SINK_HOURS = 3;
export const SINK_VALUE = 3;
export const GEM_VALUE = 4;
export const GEM_HOURS = 1;

export type Verdict = 'sink' | 'gem' | null;

/** A time sink takes a lot of your week and gives little back; a gem is the opposite. */
export function verdict(a: Activity): Verdict {
  const v = value(a);
  if (a.weeklyHours >= SINK_HOURS && v < SINK_VALUE) return 'sink';
  if (v >= GEM_VALUE && a.weeklyHours < GEM_HOURS) return 'gem';
  return null;
}

export type SortKey = 'value' | RatingKey | 'total' | 'overhead' | 'weeklyHours' | 'name';

export const SORTS: { key: SortKey; label: string; desc: boolean }[] = [
  { key: 'value', label: 'Value', desc: true },
  { key: 'enjoyment', label: 'Enjoyment', desc: true },
  { key: 'anticipation', label: 'Anticipation', desc: true },
  { key: 'afterglow', label: 'Afterwards', desc: true },
  { key: 'effort', label: 'Least effort', desc: false },
  { key: 'total', label: 'Quickest', desc: false },
  { key: 'overhead', label: 'Least setup', desc: false },
  { key: 'weeklyHours', label: 'Time per week', desc: true },
  { key: 'name', label: 'Name', desc: false },
];

function sortValue(a: Activity, key: SortKey): number | string {
  if (key === 'value') return value(a);
  if (key === 'total') return totalMinutes(a);
  if (key === 'overhead') return overheadMinutes(a);
  if (key === 'name') return a.name.toLowerCase();
  return a[key];
}

export function sortActivities(list: Activity[], key: SortKey): Activity[] {
  const desc = SORTS.find((s) => s.key === key)?.desc ?? false;
  return [...list].sort((a, b) => {
    const x = sortValue(a, key);
    const y = sortValue(b, key);
    const c = x < y ? -1 : x > y ? 1 : 0;
    return (desc ? -c : c) || a.name.localeCompare(b.name);
  });
}

/** Activities carrying any of the given tags; all of them when no tags are given. */
export function withTags(list: Activity[], tags: string[]): Activity[] {
  if (!tags.length) return list;
  return list.filter((a) => a.tags.some((t) => tags.includes(t)));
}

export function allTags(list: Activity[]): string[] {
  return [...new Set(list.flatMap((a) => a.tags))].sort((a, b) => a.localeCompare(b));
}

export interface TagSummary {
  tag: string;
  count: number;
  avgValue: number;
  weeklyHours: number;
}

export function tagSummaries(list: Activity[]): TagSummary[] {
  return allTags(list).map((tag) => {
    const items = list.filter((a) => a.tags.includes(tag));
    return {
      tag,
      count: items.length,
      avgValue: items.reduce((s, a) => s + value(a), 0) / items.length,
      weeklyHours: items.reduce((s, a) => s + a.weeklyHours, 0),
    };
  });
}

export function normaliseTag(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

export function formatHours(h: number): string {
  return `${Math.round(h * 10) / 10} h`;
}
