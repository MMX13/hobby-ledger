import { useCallback, useEffect, useState } from 'react';
import type { Activity } from '../engine/types';
import { Icon } from './components';
import { Editor } from './Editor';
import { Insights } from './Insights';
import { Ledger } from './Ledger';
import { More } from './More';
import { Picker } from './Picker';

const TABS = [
  { name: 'ledger', label: 'Ledger', icon: 'list' },
  { name: 'overview', label: 'Overview', icon: 'chart' },
  { name: 'pick', label: 'Pick', icon: 'dice' },
  { name: 'more', label: 'More', icon: 'more' },
] as const;
type Tab = (typeof TABS)[number]['name'];

function safeHistory(fn: () => void) {
  try {
    fn();
  } catch {
    /* history is unavailable in some embedded views */
  }
}

export function App({ updateReady, onUpdate }: { updateReady: boolean; onUpdate: () => void }) {
  const [tab, setTab] = useState<Tab>('ledger');
  // undefined = closed, null = new activity.
  const [editing, setEditing] = useState<Activity | null | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);

  const go = (t: Tab) => {
    setTab(t);
    window.scrollTo(0, 0);
  };

  const openEditor = useCallback((a: Activity | null) => {
    setEditing(a);
    safeHistory(() => history.pushState({ editor: true }, ''));
  }, []);

  const closeEditor = useCallback(() => {
    // The back button closes the editor, so closing it any other way pops that entry.
    if (history.state?.editor) safeHistory(() => history.back());
    else setEditing(undefined);
  }, []);

  useEffect(() => {
    const onPop = () => setEditing(undefined);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    document.body.style.overflow = editing !== undefined ? 'hidden' : '';
  }, [editing]);

  return (
    <>
      {updateReady && (
        <button className="update" onClick={onUpdate}>
          A new version is ready - tap to update
        </button>
      )}
      {tab === 'ledger' && <Ledger onEdit={openEditor} tags={tags} setTags={setTags} />}
      {tab === 'overview' && <Insights onEdit={openEditor} />}
      {tab === 'pick' && <Picker onEdit={openEditor} />}
      {tab === 'more' && <More />}

      <nav className="nav">
        <div className="nav-inner">
          {TABS.map((t) => (
            <button key={t.name} className={tab === t.name ? 'on' : ''} onClick={() => go(t.name)} aria-current={tab === t.name ? 'page' : undefined}>
              <Icon name={t.icon} size={22} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {editing !== undefined && <Editor key={editing?.id ?? 'new'} activity={editing} onClose={closeEditor} />}
    </>
  );
}
