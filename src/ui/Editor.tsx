import { useEffect, useMemo, useState } from 'react';
import { allTags, formatMinutes, normaliseTag, RATINGS, totalMinutes, value } from '../engine/scores';
import type { Activity } from '../engine/types';
import { deleteActivity, getState, newId, saveActivity, useApp } from '../data/store';
import { Icon, RatingInput } from './components';

function blank(): Activity {
  const now = Date.now();
  return { id: newId(), name: '', tags: [], enjoyment: 3, anticipation: 3, afterglow: 3, effort: 3, duration: 30, setup: 0, teardown: 0, weeklyHours: 0, notes: '', created: now, updated: now };
}

export function Editor({ activity, onClose }: { activity: Activity | null; onClose: () => void }) {
  const s = useApp();
  const [a, setA] = useState<Activity>(() => activity ?? blank());
  const [tagDraft, setTagDraft] = useState('');
  const isNew = !activity || !getState().activities.some((x) => x.id === activity.id);
  const set = <K extends keyof Activity>(k: K, v: Activity[K]) => setA((cur) => ({ ...cur, [k]: v }));

  const suggestions = useMemo(() => {
    const q = normaliseTag(tagDraft);
    return allTags(s.activities).filter((t) => !a.tags.includes(t) && (!q || t.includes(q)));
  }, [s.activities, a.tags, tagDraft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addTag = (raw: string) => {
    const t = normaliseTag(raw);
    if (t && !a.tags.includes(t)) set('tags', [...a.tags, t]);
    setTagDraft('');
  };

  const save = () => {
    // A tag still sitting in the box counts as added.
    const t = normaliseTag(tagDraft);
    saveActivity({ ...a, name: a.name.trim(), tags: t && !a.tags.includes(t) ? [...a.tags, t] : a.tags });
    onClose();
  };

  const remove = () => {
    if (confirm(`Delete "${a.name || 'this activity'}"?`)) {
      deleteActivity(a.id);
      onClose();
    }
  };

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={isNew ? 'New activity' : 'Edit activity'}>
      <div className="sheet-bar">
        <button className="icon-btn" onClick={onClose} aria-label="Cancel">
          <Icon name="close" />
        </button>
        <span className="sheet-title">{isNew ? 'New activity' : 'Edit activity'}</span>
        <button className="btn primary small-btn" onClick={save} disabled={!a.name.trim()}>
          Save
        </button>
      </div>

      <div className="sheet-body">
        <label className="field">
          <span>Name</span>
          <input value={a.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Spirit Island (solo)" autoFocus={isNew} />
        </label>

        <div className="field">
          <span>Tags</span>
          <div className="tag-box">
            {a.tags.map((t) => (
              <button key={t} type="button" className="chip on" onClick={() => set('tags', a.tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
                {t} <Icon name="close" size={12} />
              </button>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => (e.target.value.endsWith(',') ? addTag(e.target.value.slice(0, -1)) : setTagDraft(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagDraft);
                } else if (e.key === 'Backspace' && !tagDraft && a.tags.length) set('tags', a.tags.slice(0, -1));
              }}
              placeholder={a.tags.length ? 'Add another' : 'board game, solo, outdoors…'}
              aria-label="Add a tag"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="chips tight">
              {suggestions.slice(0, 12).map((t) => (
                <button key={t} type="button" className="chip" onClick={() => addTag(t)}>
                  + {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <h2 className="group-title">What it gives you</h2>
        {RATINGS.filter((r) => r.key !== 'effort').map((r) => (
          <div key={r.key} className="field">
            <span>{r.question}</span>
            <RatingInput value={a[r.key]} onChange={(n) => set(r.key, n)} labels={[r.low, r.high]} />
          </div>
        ))}

        <h2 className="group-title">What it costs you</h2>
        {RATINGS.filter((r) => r.key === 'effort').map((r) => (
          <div key={r.key} className="field">
            <span>{r.question}</span>
            <RatingInput value={a[r.key]} onChange={(n) => set(r.key, n)} labels={[r.low, r.high]} />
          </div>
        ))}
        <div className="field-row">
          <NumberField label="Setup" unit="min" value={a.setup} onChange={(n) => set('setup', n)} />
          <NumberField label="Session" unit="min" value={a.duration} onChange={(n) => set('duration', n)} />
          <NumberField label="Teardown" unit="min" value={a.teardown} onChange={(n) => set('teardown', n)} />
        </div>
        <p className="small mu hint">
          All in, about {formatMinutes(totalMinutes(a))}. Value {value(a).toFixed(1)} of 5.
        </p>
        <NumberField label="Time you spend on it in a normal week" unit="hours" value={a.weeklyHours} onChange={(n) => set('weeklyHours', n)} />

        <label className="field">
          <span>Notes</span>
          <textarea rows={3} value={a.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything worth remembering" />
        </label>

        {!isNew && (
          <button className="btn danger" onClick={remove}>
            <Icon name="trash" size={16} /> Delete activity
          </button>
        )}
      </div>
    </div>
  );
}

function NumberField({ label, unit, value, onChange }: { label: string; unit: string; value: number; onChange: (n: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
  }, [value]);
  return (
    <label className="field num">
      <span>{label}</span>
      <div className="num-input">
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value.replace(',', '.'));
            if (Number.isFinite(n) && n >= 0) onChange(n);
          }}
          onFocus={(e) => e.target.select()}
        />
        <span className="small mu">{unit}</span>
      </div>
    </label>
  );
}
