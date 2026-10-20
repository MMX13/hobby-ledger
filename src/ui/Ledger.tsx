import { useMemo, useState } from 'react';
import { allTags, formatHours, formatMinutes, RATINGS, sortActivities, SORTS, totalMinutes, value, verdict, withTags, type SortKey } from '../engine/scores';
import type { Activity } from '../engine/types';
import { EXAMPLES } from '../data/examples';
import { addActivities, update, useApp } from '../data/store';
import { Header, Icon, Pips, TagChips, toggle, VerdictPill } from './components';

export function Ledger({ onEdit, tags, setTags }: { onEdit: (a: Activity | null) => void; tags: string[]; setTags: (t: string[]) => void }) {
  const s = useApp();
  const [query, setQuery] = useState('');
  const tagList = useMemo(() => allTags(s.activities), [s.activities]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = withTags(s.activities, tags).filter((a) => !q || a.name.toLowerCase().includes(q) || a.notes.toLowerCase().includes(q));
    return sortActivities(filtered, s.prefs.sort);
  }, [s.activities, s.prefs.sort, tags, query]);

  return (
    <main className="screen with-nav">
      <Header
        eyebrow={`${s.activities.length} ${s.activities.length === 1 ? 'activity' : 'activities'}`}
        title="Hobby Ledger"
        right={
          s.activities.length > 0 && (
            <label className="sort">
              <span className="small mu">Sort</span>
              <select value={s.prefs.sort} onChange={(e) => update((d) => void (d.prefs.sort = e.target.value as SortKey))}>
                {SORTS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )
        }
      />

      {s.activities.length === 0 ? (
        <div className="empty">
          <p>
            List the things you do for fun, rate what each one gives you and what it costs, and see where your spare time actually goes.
          </p>
          <button className="btn primary" onClick={() => onEdit(null)}>
            <Icon name="plus" /> Add your first activity
          </button>
          <button className="btn" onClick={() => addActivities(EXAMPLES)}>
            Load some examples
          </button>
        </div>
      ) : (
        <>
          {s.activities.length > 5 && (
            <div className="search">
              <Icon name="search" size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search activities" />
            </div>
          )}
          <TagChips tags={tagList} selected={tags} onToggle={(t) => setTags(toggle(tags, t))} />
          {shown.length === 0 && <p className="mu pad">Nothing matches.</p>}
          <ul className="cards">
            {shown.map((a) => (
              <li key={a.id}>
                <ActivityCard a={a} onClick={() => onEdit(a)} />
              </li>
            ))}
          </ul>
        </>
      )}

      {s.activities.length > 0 && (
        <button className="fab" onClick={() => onEdit(null)} aria-label="Add activity">
          <Icon name="plus" size={26} />
        </button>
      )}
    </main>
  );
}

function ActivityCard({ a, onClick }: { a: Activity; onClick: () => void }) {
  const v = verdict(a);
  return (
    <button className={`card ${v ?? ''}`} onClick={onClick}>
      <div className="card-top">
        <div className="grow">
          <div className="card-name">{a.name || 'Untitled'}</div>
          {a.tags.length > 0 && <div className="card-tags small mu">{a.tags.join(' · ')}</div>}
        </div>
        <div className="score" title="Value - how much it gives back, 1 to 5">
          <span className="score-n">{value(a).toFixed(1)}</span>
          <span className="small mu">value</span>
        </div>
      </div>
      <div className="metrics">
        {RATINGS.map((r) => (
          <div key={r.key} className="metric">
            <span className="small mu">{r.label}</span>
            <Pips n={a[r.key]} tone={r.key === 'effort' ? 'effort' : 'accent'} />
          </div>
        ))}
      </div>
      <div className="card-foot small mu">
        <span>
          <Icon name="clock" size={13} /> {formatMinutes(totalMinutes(a))}
          {a.setup + a.teardown > 0 && ` (${a.setup} + ${a.duration} + ${a.teardown})`}
        </span>
        {a.weeklyHours > 0 && <span>{formatHours(a.weeklyHours)} / week</span>}
        <VerdictPill v={v} />
      </div>
    </button>
  );
}
