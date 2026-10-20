import { totalMinutes, value, verdict } from './scores';
import type { Activity } from './types';

export interface PickOptions {
  /** Time available, including setup and teardown. */
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

/** Chance weighting: higher value is much more likely, but anything that fits can come up. */
export function weight(a: Activity): number {
  return value(a) ** 2;
}

/** Picks one activity that fits, favouring the ones that give more back. */
export function pick(list: Activity[], o: PickOptions, rand: () => number = Math.random): Activity | null {
  const fits = candidates(list, o);
  const fresh = fits.filter((a) => !o.exclude.includes(a.id));
  const pool = fresh.length ? fresh : fits;
  if (!pool.length) return null;
  const total = pool.reduce((s, a) => s + weight(a), 0);
  let r = rand() * total;
  for (const a of pool) {
    r -= weight(a);
    if (r < 0) return a;
  }
  return pool[pool.length - 1];
}
