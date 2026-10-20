import { useRef, useState } from 'react';
import { GEM_HOURS, GEM_VALUE, SINK_HOURS, SINK_VALUE } from '../engine/scores';
import { EXAMPLES } from '../data/examples';
import { addActivities, emptyState, getState, isValidBackup, normalise, replaceState, update, useApp } from '../data/store';
import { Header } from './components';

export function More() {
  const s = useApp();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const exportJson = () => {
    const name = `hobby-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    update((d) => void (d.prefs.lastBackup = Date.now()));
    setMsg(`Saved ${name} to your downloads.`);
  };

  const importJson = async (f: File) => {
    try {
      const raw = JSON.parse(await f.text());
      if (!isValidBackup(raw)) throw new Error();
      const next = normalise(raw);
      if (!confirm(`Replace your ${s.activities.length} activities with the ${next.activities.length} in this backup?`)) return;
      replaceState(next);
      setMsg(`Restored ${next.activities.length} activities.`);
    } catch {
      setMsg('That file isn’t a Hobby Ledger backup.');
    }
  };

  return (
    <main className="screen with-nav">
      <Header title="More" />

      <section className="panel">
        <h2 className="panel-title">Backup</h2>
        <p className="small mu">
          Everything is stored on this device only. Export a backup now and then so you don’t lose it.
          {s.prefs.lastBackup && ` Last backup ${new Date(s.prefs.lastBackup).toLocaleDateString()}.`}
        </p>
        <div className="btns">
          <button className="btn" onClick={exportJson} disabled={!s.activities.length}>
            Export backup
          </button>
          <button className="btn" onClick={() => file.current?.click()}>
            Import backup
          </button>
        </div>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => (e.target.files?.[0] && importJson(e.target.files[0]), (e.target.value = ''))} />
        {msg && <p className="small">{msg}</p>}
      </section>

      <section className="panel">
        <h2 className="panel-title">How the numbers work</h2>
        <ul className="small mu prose">
          <li>
            <b>Value</b> is what an activity gives back, 1 to 5: enjoyment, looking forward and how you feel afterwards, with afterwards counting double -
            lasting enjoyment is what matters here.
          </li>
          <li>
            <b>Time sink</b>: {SINK_HOURS}+ hours a week with a value under {SINK_VALUE}.
          </li>
          <li>
            <b>Under-used gem</b>: value {GEM_VALUE}+ but less than {GEM_HOURS} hour a week.
          </li>
          <li>
            <b>Pick for me</b> only suggests things that fit your time (setup and teardown included) and energy. Higher-value activities are more likely to come
            up, and it won’t repeat until it has run through everything that fits.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel-title">Data</h2>
        <div className="btns">
          <button className="btn" onClick={() => (addActivities(EXAMPLES), setMsg(''))}>
            Add example activities
          </button>
          <button
            className="btn danger"
            disabled={!s.activities.length}
            onClick={() => confirm('Delete every activity? This can’t be undone.') && replaceState({ ...emptyState(), prefs: s.prefs })}
          >
            Delete everything
          </button>
        </div>
      </section>
    </main>
  );
}
