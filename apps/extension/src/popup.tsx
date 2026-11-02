import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@jc/shared/styles.css';
import { Analyzer, Contacts, Contact, Store, extractPage } from '@jc/shared';

const chromeStore: Store = {
  async load() { return ((await chrome.storage.local.get('contacts')).contacts as Contact[]) || []; },
  async save(c) { await chrome.storage.local.set({ contacts: c }); },
};

type Init = { text: string; url: string; hints: { title?: string; company?: string; location?: string } } | null;

function App() {
  const [tab, setTab] = useState<'a' | 'c'>('a');
  const [init, setInit] = useState<Init | undefined>(undefined);
  const [note, setNote] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!t?.id || !/^https?:/.test(t.url || '')) throw new Error('unsupported');
        const [r] = await chrome.scripting.executeScript({ target: { tabId: t.id }, func: extractPage });
        const p = r.result as ReturnType<typeof extractPage>;
        if (!p || p.text.length < 80) throw new Error('empty');
        setInit({ text: p.text, url: p.url, hints: { title: p.title, company: p.company, location: p.location } });
      } catch {
        setNote('Couldn’t read this page automatically. Paste the job description below.');
        setInit(null);
      }
    })();
  }, []);
  return (
    <>
      <div className="nav"><div className="wrap"><b>JobContact <span>AI</span></b></div></div>
      <div className="tabs">
        <button className={tab === 'a' ? 'on' : ''} onClick={() => setTab('a')}>Analyze job</button>
        <button className={tab === 'c' ? 'on' : ''} onClick={() => setTab('c')}>Saved contacts</button>
      </div>
      <div className="wrap">
        {tab === 'a' && (init === undefined ? <p className="hint">Reading this page…</p> : <>
          {note && <p className="hint">{note}</p>}
          {init && <p className="hint">Page read: <b>{init.hints.title}</b>{init.hints.company ? ` at ${init.hints.company}` : ''}. Click Find People.</p>}
          <Analyzer store={chromeStore} initial={init} />
        </>)}
        {tab === 'c' && <Contacts store={chromeStore} />}
      </div>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
