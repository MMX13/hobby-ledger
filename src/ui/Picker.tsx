import { useMemo, useState } from 'react';
import { candidates, pick, sessionFor, type PickOptions } from '../engine/picker';
import { allTags, formatMinutes, value } from '../engine/scores';
import type { Activity } from '../engine/types';
import { useApp } from '../data/store';
import { Header, Icon, Pips, TagChips, toggle } from './components';

const TIMES = [15, 30, 60, 90, 120, 180, 240];
const ENERGY = [
  { label: 'Running on empty', max: 1 },
  { label: 'A bit', max: 2 },
  { label: 'Some', max: 3 },
  { label: 'Plenty', max: 5 },
];

export function Picker({ onEdit }: { onEdit: (a: Activity) => void }) {
  const s = useApp();
  const [minutes, setMinutes] = useState(60);
  const [maxEffort, setMaxEffort] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [skipSinks, setSkipSinks] = useState(true);
  const [result, setResult] = useState<Activity | null | undefined>(undefined);
  const [seen, setSeen] = useState<string[]>([]);

  const opts: PickOptions = { minutes, maxEffort, tags, skipSinks, exclude: seen };
  const fits = candidates(s.activities, opts);
  const tagList = useMemo(() => allTags(s.activities), [s.activities]);

  const reset = () => {
    setResult(undefined);
    setSeen([]);
  };
  const roll = () => {
    const p = pick(s.activities, opts);
    setResult(p);
    if (p) setSeen((cur) => (cur.length + 1 >= fits.length ? [p.id] : [...cur, p.id]));
  };

  return (
    <main className="screen with-nav">
      <Header title="Pick for me" eyebrow="Got some free time?" />

      <section className="panel">
        <h2 className="panel-title">How much time do you have?</h2>
        <div className="chips wrap">
          {TIMES.map((m) => (
            <button key={m} className={`chip ${minutes === m ? 'on' : ''}`} onClick={() => (setMinutes(m), reset())}>
              {m < 60 ? `${m} min` : `${m / 60} h`}
            </button>
          ))}
        </div>
        <p className="small mu">Setup, teardown and the minimum useful session have to fit.</p>

        <h2 className="panel-title">How much energy have you got?</h2>
        <div className="chips wrap">
          {ENERGY.map((e) => (
            <button key={e.max} className={`chip ${maxEffort === e.max ? 'on' : ''}`} onClick={() => (setMaxEffort(e.max), reset())}>
              {e.label}
            </button>
          ))}
        </div>

        {tagList.length > 0 && (
          <>
            <h2 className="panel-title">In the mood for…</h2>
            <TagChips tags={tagList} selected={tags} onToggle={(t) => (setTags(toggle(tags, t)), reset())} />
            <p className="small mu">{tags.length ? 'Any of the selected tags.' : 'Anything - tap tags to narrow it down.'}</p>
          </>
        )}

        <label className="check">
          <input type="checkbox" checked={skipSinks} onChange={(e) => (setSkipSinks(e.target.checked), reset())} />
          Leave out time sinks
        </label>
      </section>

      <div className="pad">
        <button className="btn primary big" onClick={roll} disabled={!fits.length}>
          <Icon name="dice" /> {result ? 'Something else' : 'Pick something'}
        </button>
        <p className="small mu center">
          {fits.length === 0
            ? 'Nothing fits - try more time, more energy or fewer tags.'
            : `${fits.length} ${fits.length === 1 ? 'activity fits' : 'activities fit'}. Higher value ones come up more often.`}
        </p>
      </div>

      {result && (
        <button className="card result" onClick={() => onEdit(result)}>
          <div className="eyebrow">How about</div>
          <div className="result-name">{result.name}</div>
          {result.tags.length > 0 && <div className="small mu">{result.tags.join(' · ')}</div>}
          <div className="result-facts">
            <span>
              <Icon name="clock" size={14} /> <SessionLine a={result} minutes={minutes} />
              {result.setup + result.teardown > 0 && <span className="mu"> + {result.setup + result.teardown} min setup/teardown</span>}
            </span>
            <span>
              Value {value(result).toFixed(1)} · Effort <Pips n={result.effort} tone="effort" />
            </span>
          </div>
          {result.notes && <p className="small mu">{result.notes}</p>}
        </button>
      )}
    </main>
  );
}

function SessionLine({ a, minutes }: { a: Activity; minutes: number }) {
  if (!a.idealSession) return <>At least {formatMinutes(a.minSession)}</>;
  const session = sessionFor(a, minutes);
  return session >= a.idealSession ? (
    <>A full {formatMinutes(session)} session</>
  ) : (
    <>
      {formatMinutes(session)} <span className="mu">of your ideal {formatMinutes(a.idealSession)}</span>
    </>
  );
}
