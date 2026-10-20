import { useSyncExternalStore } from 'react';
import { normaliseTag, type SortKey } from '../engine/scores';
import type { Activity } from '../engine/types';

export interface Prefs {
  sort: SortKey;
  lastBackup: number | null;
}

export interface AppState {
  version: 1;
  activities: Activity[];
  prefs: Prefs;
}

export const DEFAULT_PREFS: Prefs = { sort: 'value', lastBackup: null };

export function emptyState(): AppState {
  return { version: 1, activities: [], prefs: { ...DEFAULT_PREFS } };
}

const clampRating = (n: unknown) => (typeof n === 'number' && n >= 1 && n <= 5 ? Math.round(n) : 3);
const nonNeg = (n: unknown) => (typeof n === 'number' && n >= 0 ? n : 0);

export function normaliseActivity(raw: Partial<Activity>): Activity {
  const now = Date.now();
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    name: typeof raw.name === 'string' ? raw.name : '',
    tags: Array.isArray(raw.tags) ? [...new Set(raw.tags.filter((t) => typeof t === 'string').map(normaliseTag).filter(Boolean))] : [],
    enjoyment: clampRating(raw.enjoyment),
    anticipation: clampRating(raw.anticipation),
    afterglow: clampRating(raw.afterglow),
    effort: clampRating(raw.effort),
    duration: nonNeg(raw.duration),
    setup: nonNeg(raw.setup),
    teardown: nonNeg(raw.teardown),
    weeklyHours: nonNeg(raw.weeklyHours),
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    created: typeof raw.created === 'number' ? raw.created : now,
    updated: typeof raw.updated === 'number' ? raw.updated : now,
  };
}

/** Fill in anything missing from older or imported data. */
export function normalise(raw: unknown): AppState {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  return {
    version: 1,
    activities: Array.isArray(r.activities) ? r.activities.map(normaliseActivity) : [],
    prefs: { ...DEFAULT_PREFS, ...(r.prefs ?? {}) },
  };
}

export function isValidBackup(raw: unknown): boolean {
  return !!raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).activities);
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Persistence - one JSON document in IndexedDB, with localStorage as a fallback.

const DB_NAME = 'hobby-ledger';
const STORE = 'kv';
const KEY = 'state';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
function db() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

async function readStored(): Promise<unknown> {
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const req = d.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const s = localStorage.getItem(DB_NAME);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }
}

async function writeStored(value: AppState): Promise<void> {
  try {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem(DB_NAME, JSON.stringify(value));
    } catch {
      /* nothing else to try */
    }
  }
}

// Store

let state: AppState = emptyState();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saving: Promise<void> = Promise.resolve();

export async function loadState(): Promise<AppState> {
  state = normalise(await readStored());
  emit();
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* not supported */
  }
  return state;
}

function emit() {
  for (const l of listeners) l();
}

/** Save now. Saves run one at a time, in order. */
export function flush(): Promise<void> {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const snapshot = state;
  saving = saving.then(() => writeStored(snapshot)).catch(() => undefined);
  return saving;
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flush(), 400);
}

export function getState(): AppState {
  return state;
}

/** Apply a change to a copy of the state, then save. */
export function update(fn: (draft: AppState) => void): void {
  const draft = structuredClone(state);
  fn(draft);
  state = draft;
  emit();
  scheduleSave();
}

export function replaceState(next: AppState): void {
  state = next;
  emit();
  void flush();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getState);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
}

// Actions

export function saveActivity(a: Activity): void {
  const next = normaliseActivity({ ...a, updated: Date.now() });
  update((s) => {
    const i = s.activities.findIndex((x) => x.id === next.id);
    if (i >= 0) s.activities[i] = next;
    else s.activities.push(next);
  });
}

export function deleteActivity(id: string): void {
  update((s) => {
    s.activities = s.activities.filter((a) => a.id !== id);
  });
}

export function addActivities(list: Partial<Activity>[]): void {
  update((s) => {
    s.activities.push(...list.map((a) => normaliseActivity({ ...a, id: undefined })));
  });
}
