import type { ReactNode } from 'react';
import type { Verdict } from '../engine/scores';

const PATHS: Record<string, string> = {
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  chart: 'M4 20V4M4 20h16M8 16l3-4 3 2 5-7',
  dice: 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M15 6l-6 6 6 6',
  clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  sink: 'M12 4v12M6 12l6 6 6-6',
  gem: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
  tag: 'M3 12V4h8l9 9-8 8zM7.5 7.5h.01',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-4-4',
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Five pips, filled up to the rating. */
export function Pips({ n, tone = 'accent' }: { n: number; tone?: 'accent' | 'effort' }) {
  return (
    <span className={`pips ${tone}`} aria-label={`${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= n ? 'on' : ''} />
      ))}
    </span>
  );
}

export function RatingInput({ value, onChange, labels }: { value: number; onChange: (n: number) => void; labels: [string, string] }) {
  return (
    <div className="rating-input">
      <div className="seg">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" className={i === value ? 'on' : i < value ? 'below' : ''} onClick={() => onChange(i)} aria-pressed={i === value}>
            {i}
          </button>
        ))}
      </div>
      <div className="seg-labels small mu">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  );
}

export function VerdictPill({ v }: { v: Verdict }) {
  if (v === 'sink')
    return (
      <span className="pill sink">
        <Icon name="sink" size={12} /> Time sink
      </span>
    );
  if (v === 'gem')
    return (
      <span className="pill gem">
        <Icon name="gem" size={12} /> Under-used gem
      </span>
    );
  return null;
}

export function TagChips({ tags, selected, onToggle }: { tags: string[]; selected: string[]; onToggle: (t: string) => void }) {
  if (!tags.length) return null;
  return (
    <div className="chips">
      {tags.map((t) => (
        <button key={t} className={`chip ${selected.includes(t) ? 'on' : ''}`} onClick={() => onToggle(t)} aria-pressed={selected.includes(t)}>
          {t}
        </button>
      ))}
    </div>
  );
}

export function Header({ title, eyebrow, right }: { title: string; eyebrow?: string; right?: ReactNode }) {
  return (
    <header className="head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>
      {right}
    </header>
  );
}

export function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
