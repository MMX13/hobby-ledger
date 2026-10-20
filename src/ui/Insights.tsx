import { useMemo, useState } from 'react';
import { formatHours, formatMinutes, GEM_HOURS, GEM_VALUE, overheadMinutes, SINK_HOURS, SINK_VALUE, sortActivities, tagSummaries, value, verdict } from '../engine/scores';
import type { Activity } from '../engine/types';
import { useApp } from '../data/store';
import { Header, Icon } from './components';

export function Insights({ onEdit }: { onEdit: (a: Activity) => void }) {
  const s = useApp();
  const list = s.activities;
  const sinks = useMemo(() => sortActivities(list.filter((a) => verdict(a) === 'sink'), 'weeklyHours'), [list]);
  const gems = useMemo(() => sortActivities(list.filter((a) => verdict(a) === 'gem'), 'value'), [list]);
  const fiddly = useMemo(() => [...list].filter((a) => overheadMinutes(a) > 0).sort((a, b) => overheadMinutes(b) - overheadMinutes(a)).slice(0, 5), [list]);
  const tags = useMemo(() => tagSummaries(list).sort((a, b) => b.weeklyHours - a.weeklyHours || b.avgValue - a.avgValue), [list]);
  const weekly = list.reduce((t, a) => t + a.weeklyHours, 0);
  const sinkHours = sinks.reduce((t, a) => t + a.weeklyHours, 0);

  if (!list.length)
    return (
      <main className="screen with-nav">
        <Header title="Overview" />
        <p className="mu pad">Add a few activities and this page will show where your spare time goes and what it gives back.</p>
      </main>
    );

  return (
    <main className="screen with-nav">
      <Header title="Overview" eyebrow="Where your spare time goes" />

      <div className="tiles">
        <div className="tile">
          <div className="tile-n">{formatHours(weekly)}</div>
          <div className="small mu">spare time per week, all activities</div>
        </div>
        <div className="tile">
          <div className="tile-n">{formatHours(sinkHours)}</div>
          <div className="small mu">
            of it on time sinks{weekly > 0 && sinkHours > 0 ? ` (${Math.round((sinkHours / weekly) * 100)}%)` : ''}
          </div>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel-title">Time against value</h2>
        <p className="small mu">Each dot is an activity. Bottom right is lots of time for little back; top left is good stuff you rarely do.</p>
        <Scatter list={list} onEdit={onEdit} />
      </section>

      <ListPanel
        title="Time sinks"
        icon="sink"
        tone="sink"
        empty={`Nothing here - no activity takes ${SINK_HOURS}+ hours a week with a value under ${SINK_VALUE}.`}
        items={sinks}
        detail={(a) => `${formatHours(a.weeklyHours)} / week · value ${value(a).toFixed(1)}`}
        onEdit={onEdit}
      />
      <ListPanel
        title="Under-used gems"
        icon="gem"
        tone="gem"
        empty={`Nothing here - no activity with value ${GEM_VALUE}+ that you do less than ${GEM_HOURS} hour a week.`}
        items={gems}
        detail={(a) => `value ${value(a).toFixed(1)} · ${formatMinutes(a.setup + a.duration + a.teardown)} all in`}
        onEdit={onEdit}
      />
      {fiddly.length > 0 && (
        <ListPanel
          title="Most setup and teardown"
          icon="clock"
          tone=""
          empty=""
          items={fiddly}
          detail={(a) => `${formatMinutes(overheadMinutes(a))} around a ${formatMinutes(a.duration)} session`}
          onEdit={onEdit}
        />
      )}

      {tags.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">By tag</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Tag</th>
                <th className="r">Count</th>
                <th className="r">Avg value</th>
                <th className="r">Per week</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr key={t.tag}>
                  <td>{t.tag}</td>
                  <td className="r">{t.count}</td>
                  <td className="r">{t.avgValue.toFixed(1)}</td>
                  <td className="r">{formatHours(t.weeklyHours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function ListPanel({ title, icon, tone, empty, items, detail, onEdit }: { title: string; icon: string; tone: string; empty: string; items: Activity[]; detail: (a: Activity) => string; onEdit: (a: Activity) => void }) {
  return (
    <section className="panel">
      <h2 className={`panel-title ${tone}`}>
        <Icon name={icon} size={16} /> {title}
      </h2>
      {items.length === 0 ? (
        <p className="small mu">{empty}</p>
      ) : (
        <ul className="rows">
          {items.map((a) => (
            <li key={a.id}>
              <button className="row" onClick={() => onEdit(a)}>
                <span className="grow">{a.name}</span>
                <span className="small mu">{detail(a)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Chart geometry, in viewBox units.
const W = 340;
const H = 230;
const M = { l: 30, r: 12, t: 24, b: 30 };

function niceMax(n: number): number {
  for (const step of [5, 10, 15, 20, 30, 40, 60, 80, 100]) if (n <= step) return step;
  return Math.ceil(n / 50) * 50;
}

/** Keep the tooltip inside the chart near the left and right edges. */
function tipShift(fraction: number): string {
  if (fraction < 0.3) return '-12%';
  if (fraction > 0.7) return '-88%';
  return '-50%';
}

function Scatter({ list, onEdit }: { list: Activity[]; onEdit: (a: Activity) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const maxX = niceMax(Math.max(SINK_HOURS + 2, ...list.map((a) => a.weeklyHours)));
  const x = (h: number) => M.l + (h / maxX) * (W - M.l - M.r);
  const y = (v: number) => M.t + ((5 - v) / 4) * (H - M.t - M.b);
  const xTicks = [0, maxX / 4, maxX / 2, (3 * maxX) / 4, maxX];
  const active = list.find((a) => a.id === hover);

  return (
    <div className="scatter">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Scatter plot of hours per week against value for each activity">
        <rect className="zone sink" x={x(SINK_HOURS)} y={y(SINK_VALUE)} width={x(maxX) - x(SINK_HOURS)} height={y(1) - y(SINK_VALUE)} rx={4} />
        <rect className="zone gem" x={x(0)} y={y(5)} width={x(GEM_HOURS) - x(0)} height={y(GEM_VALUE) - y(5)} rx={4} />
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line className="grid" x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} />
            <text className="tick" x={M.l - 8} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((h) => (
          <text key={h} className="tick" x={x(h)} y={H - M.b + 16} textAnchor="middle">
            {Math.round(h * 10) / 10}
          </text>
        ))}
        <text className="axis-label" x={W - M.r} y={H - 2} textAnchor="end">
          hours per week →
        </text>
        <text className="axis-label" x={4} y={10}>
          value
        </text>
        {list.map((a) => {
          const v = verdict(a);
          return (
            <g key={a.id} className={`dot ${v ?? ''} ${hover === a.id ? 'on' : ''}`} onMouseEnter={() => setHover(a.id)} onMouseLeave={() => setHover(null)} onClick={() => (hover === a.id ? onEdit(a) : setHover(a.id))}>
              <circle className="hit" cx={x(a.weeklyHours)} cy={y(value(a))} r={14} />
              <circle className="mark" cx={x(a.weeklyHours)} cy={y(value(a))} r={5.5} />
            </g>
          );
        })}
      </svg>
      {active && (
        <div className="tip" style={{ left: `${(x(active.weeklyHours) / W) * 100}%`, top: `${(y(value(active)) / H) * 100}%`, ['--tx' as string]: tipShift(x(active.weeklyHours) / W) }}>
          <strong>{active.name}</strong>
          <span>
            value {value(active).toFixed(1)} · {formatHours(active.weeklyHours)} / week
          </span>
          <span className="mu">tap again to edit</span>
        </div>
      )}
      <div className="legend small mu">
        <span>
          <i className="sw sink" /> Time sink
        </span>
        <span>
          <i className="sw gem" /> Under-used gem
        </span>
        <span>
          <i className="sw" /> Everything else
        </span>
      </div>
    </div>
  );
}
