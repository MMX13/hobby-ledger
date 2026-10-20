import assert from 'node:assert/strict';
import { test } from 'node:test';
import { candidates, pick, sessionFor, weight, type PickOptions } from './picker';
import { allTags, idealTotalMinutes, sessionRange, sortActivities, tagSummaries, totalMinutes, value, verdict, withTags } from './scores';
import type { Activity } from './types';

function act(over: Partial<Activity>): Activity {
  return {
    id: over.name ?? 'x',
    name: 'x',
    tags: [],
    enjoyment: 3,
    anticipation: 3,
    afterglow: 3,
    effort: 3,
    minSession: 30,
    idealSession: null,
    setup: 0,
    teardown: 0,
    weeklyHours: 0,
    notes: '',
    created: 0,
    updated: 0,
    ...over,
  };
}

const scroll = act({ name: 'Scrolling', enjoyment: 3, anticipation: 1, afterglow: 1, effort: 1, minSession: 30, weeklyHours: 10, tags: ['screen'] });
const spirit = act({ name: 'Spirit Island', enjoyment: 5, anticipation: 5, afterglow: 5, effort: 3, minSession: 60, idealSession: 90, setup: 15, teardown: 10, tags: ['board game', 'solo'] });
const walk = act({ name: 'Walk', enjoyment: 4, anticipation: 3, afterglow: 4, effort: 2, minSession: 20, idealSession: 40, weeklyHours: 2, tags: ['outdoors'] });
const all = [scroll, spirit, walk];
const opts: PickOptions = { minutes: 60, maxEffort: 5, tags: [], skipSinks: false, exclude: [] };

test('value weights how you feel afterwards double and takes off for effort', () => {
  assert.equal(value(scroll), 1.5);
  assert.equal(value(spirit), 4.5);
  assert.equal(value(walk), 3.5);
  assert.equal(value(act({ enjoyment: 5, anticipation: 5, afterglow: 5, effort: 5 })), 4);
  assert.equal(value(act({ enjoyment: 1, anticipation: 1, afterglow: 1, effort: 5 })), 0);
});

test('total time uses the minimum session; ideal total uses the ideal', () => {
  assert.equal(totalMinutes(spirit), 85);
  assert.equal(idealTotalMinutes(spirit), 115);
  assert.equal(idealTotalMinutes(scroll), 30);
  assert.equal(sessionRange(spirit), '60–90 min');
  assert.equal(sessionRange(scroll), '30 min');
});

test('verdict flags time sinks and under-used gems', () => {
  assert.equal(verdict(scroll), 'sink');
  assert.equal(verdict(spirit), 'gem');
  assert.equal(verdict(walk), null);
});

test('sorting respects direction and falls back to name', () => {
  assert.deepEqual(sortActivities(all, 'value').map((a) => a.name), ['Spirit Island', 'Walk', 'Scrolling']);
  assert.deepEqual(sortActivities(all, 'effort').map((a) => a.name), ['Scrolling', 'Walk', 'Spirit Island']);
  assert.deepEqual(sortActivities(all, 'total').map((a) => a.name), ['Walk', 'Scrolling', 'Spirit Island']);
});

test('tag filtering matches any tag', () => {
  assert.deepEqual(withTags(all, ['solo', 'outdoors']).map((a) => a.name), ['Spirit Island', 'Walk']);
  assert.equal(withTags(all, []).length, 3);
  assert.deepEqual(allTags(all), ['board game', 'outdoors', 'screen', 'solo']);
  const screen = tagSummaries(all).find((t) => t.tag === 'screen')!;
  assert.equal(screen.count, 1);
  assert.equal(screen.weeklyHours, 10);
});

test('candidates only need the minimum session to fit', () => {
  assert.deepEqual(candidates(all, opts).map((a) => a.name), ['Scrolling', 'Walk']);
  assert.deepEqual(candidates(all, { ...opts, minutes: 85 }).map((a) => a.name), ['Scrolling', 'Spirit Island', 'Walk']);
  assert.deepEqual(candidates(all, { ...opts, maxEffort: 1 }).map((a) => a.name), ['Scrolling']);
  assert.deepEqual(candidates(all, { ...opts, skipSinks: true }).map((a) => a.name), ['Walk']);
  assert.deepEqual(candidates(all, { ...opts, tags: ['outdoors'] }).map((a) => a.name), ['Walk']);
});

test('session length fills the time up to the ideal', () => {
  assert.equal(sessionFor(spirit, 85), 60);
  assert.equal(sessionFor(spirit, 100), 75);
  assert.equal(sessionFor(spirit, 300), 90);
  assert.equal(sessionFor(scroll, 300), 30);
});

test('weight favours getting closer to the ideal session', () => {
  assert.equal(weight(spirit, 115), 4.5 ** 2);
  assert.equal(weight(spirit, 85), 4.5 ** 2 * (0.5 + 0.5 * (60 / 90)));
  assert.equal(weight(scroll, 30), 1.5 ** 2);
});

test('pick favours higher value and avoids repeats', () => {
  // Weights at 60 min: scrolling 2.25, walk 12.25.
  assert.equal(pick(all, opts, () => 0)?.name, 'Scrolling');
  assert.equal(pick(all, opts, () => 0.5)?.name, 'Walk');
  assert.equal(pick(all, { ...opts, exclude: ['Walk'] }, () => 0.99)?.name, 'Scrolling');
  // Everything excluded - start over rather than give up.
  assert.ok(pick(all, { ...opts, exclude: ['Walk', 'Scrolling'] }));
  assert.equal(pick(all, { ...opts, minutes: 5 }), null);
});
