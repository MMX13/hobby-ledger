import { totalMinutes, value, verdict } from './scores';
import type { Activity } from './types';

export interface PickOptions {
  /** Time available, including setup and teardown. Only the minimum useful session has to fit. */
  minutes: number;
  /** Highest effort you're up for, 1 to 5. */
  maxEffort: number;
  /** Only activities with any of these tags; any activity when empty. */
  tags: string[];
  skipSinks: boolean;
  /** Already offered this round - left out unless nothing else fits. */
  exclude: string[];
}

export function candidates(list: Activity[], o: PickOptions): Activity[] {
  return list.filter(
    (a) =>
      totalMinutes(a) <= o.minutes &&
      a.effort <= o.maxEffort &&
      (!o.tags.length || a.tags.some((t) => o.tags.includes(t))) &&
      !(o.skipSinks && verdict(a) === 'sink'),
  );
}

/** How long a session you'd get in the time available: the ideal if it fits, otherwise whatever's left. */
export function sessionFor(a: Activity, minutes: number): number {
  const room = minutes - a.setup - a.teardown;
  return a.idealSession ? Math.max(a.minSession, Math.min(a.idealSession, room)) : a.minSession;
}

/**
 * Chance weighting: higher value is much more likely, but anything that fits can
 * come up. Activities that only get part of their ideal session count for less -
 * down to half as much when you'd only get the minimum.
 */
export function weight(a: Activity, minutes: number): number {
  const fit = a.idealSession && a.idealSession > a.minSession ? sessionFor(a, minutes) / a.idealSession : 1;
  return Math.max(0, value(a)) ** 2 * (0.5 + 0.5 * fit);
}

/** Picks one activity that fits, favouring the ones that give more back. */
export function pick(list: Activity[], o: PickOptions, rand: () => number = Math.random): Activity | null {
  const fits = candidates(list, o);
  const fresh = fits.filter((a) => !o.exclude.includes(a.id));
  const pool = fresh.length ? fresh : fits;
  if (!pool.length) return null;
  const total = pool.reduce((s, a) => s + weight(a, o.minutes), 0);
  let r = rand() * total;
  for (const a of pool) {
    r -= weight(a, o.minutes);
    if (r < 0) return a;
  }
  return pool[pool.length - 1];
}
