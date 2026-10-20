import type { Activity } from '../engine/types';

/** A handful of examples to show how the ledger reads. Easy to delete afterwards. */
export const EXAMPLES: Partial<Activity>[] = [
  { name: 'Scrolling Reddit', tags: ['screen', 'phone'], enjoyment: 3, anticipation: 2, afterglow: 1, effort: 1, duration: 30, setup: 0, teardown: 0, weeklyHours: 8, notes: 'Easy to start, hard to stop.' },
  { name: 'Spirit Island (solo)', tags: ['board game', 'solo'], enjoyment: 5, anticipation: 4, afterglow: 5, effort: 4, duration: 90, setup: 15, teardown: 10, weeklyHours: 0.5 },
  { name: 'Mage Knight (solo)', tags: ['board game', 'solo'], enjoyment: 4, anticipation: 4, afterglow: 4, effort: 5, duration: 150, setup: 25, teardown: 15, weeklyHours: 0 },
  { name: 'Slay the Spire', tags: ['video game', 'solo', 'screen'], enjoyment: 4, anticipation: 3, afterglow: 3, effort: 2, duration: 45, setup: 1, teardown: 0, weeklyHours: 3 },
  { name: 'Evening walk', tags: ['outdoors'], enjoyment: 4, anticipation: 3, afterglow: 5, effort: 2, duration: 40, setup: 5, teardown: 0, weeklyHours: 2 },
  { name: 'Reading a novel', tags: ['reading'], enjoyment: 4, anticipation: 4, afterglow: 4, effort: 2, duration: 45, setup: 0, teardown: 0, weeklyHours: 1.5 },
  { name: 'YouTube rabbit holes', tags: ['screen'], enjoyment: 3, anticipation: 2, afterglow: 2, effort: 1, duration: 40, setup: 0, teardown: 0, weeklyHours: 6 },
];
