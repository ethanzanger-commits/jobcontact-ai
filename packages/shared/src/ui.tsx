'use client';
import React, { useEffect, useState } from 'react';
import { Contact, Hints, Job, Store, Suggestion, parseJob, suggest, toCSV } from './core';

const blank = (): Contact => ({ id: '', name: '', title: '', company: '', email: '', linkedin: '', source: '', notes: '', confidence: 'Guess', createdAt: 0 });

export function useContacts(store: Store) {
  const [list, setList] = useState<Contact[]>([]);
  useEffect(() => { store.load().then(setList); }, [store]);
  const commit = (n: Contact[]) => { setList(n); store.save(n); };
  const upsert = (c: Contact) => commit(c.id ? list.map((x) => (x.id === c.id ? c : x)) : [{ ...c, id: crypto.randomUUID(), createdAt: Date.now() }, ...list]);
  const remove = (id: string) => commit(list.filter((x) => x.id !== id));
  return { list, upsert, remove };
}

export function ContactForm({ initial, onSave, onCancel }: { initial: Contact; onSave: (c: Contact) => void; onCancel: () => void }) {
  const [c, setC] = useState<Contact>(initial);
  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setC({ ...c, [k]: e.target.value } as Contact);
  const labels: Record<string, string> = { name: 'Name', title: 'Job title', company: 'Company', email: 'Email address', linkedin: 'LinkedIn URL (public profile)', source: 'Source website' };
  return (
    <div className="form">
      {(Object.keys(labels) as (keyof Contact)[]).map((k) => (
        <label key={k}>{labels[k]}<input value={String(c[k])} onChange={set(k)} /></label>
      ))}
      <label>Confidence<select value={c.confidence} onChange={set('confidence')}><option>Confirmed</option><option>Likely</option><option>Guess</option></select></label>
      <label>Notes<textarea value={c.notes} onChange={set('notes')} /></label>
      <p className="hint">Emails are saved as you enter them and are never marked verified.</p>
      <div className="row">
        <button className="btn" disabled={!c.name.trim()} onClick={() => onSave(c)}>Save contact</button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

type Initial = { text: string; url: string; hints: Hints };

export function Analyzer({ store, fetchUrl, initial }: { store: Store; fetchUrl?: (u: string) => Promise<{ text: string; hints: Hints }>; initial?: Initial | null }) {
  const [input, setInput] = useState(initial?.text || '');
  const [src, setSrc] = useState<{ url: string; hints: Hints }>({ url: initial?.url || '', hints: initial?.hints || {} });
  const [job, setJob] = useState<Job | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState('');
  const [done, setDone] = useState('');
  const { upsert } = useContacts(store);

  const find = async () => {
    setErr(''); setDone('');
    const v = input.trim();
    if (!v) return;
    if (/^https?:\/\/\S+$/.test(v)) {
      if (!fetchUrl) { setErr('Paste the job description here, or open the job page and click the extension.'); return; }
      setBusy(true);
      try { const r = await fetchUrl(v); setSrc({ url: v, hints: r.hints }); setJob(parseJob(r.text, v, r.hints)); }
      catch (e: any) { setErr(e?.message || "Couldn't read that page. Paste the job description instead."); }
      setBusy(false);
    } else setJob(parseJob(v, src.url, src.hints));
  };
  const sugg: Suggestion[] = job ? suggest(job) : [];
  const edit = (k: 'title' | 'company' | 'location') => (e: React.ChangeEvent<HTMLInputElement>) => job && setJob({ ...job, [k]: e.target.value });

  return (
    <div className="stack">
      <textarea className="big" placeholder="Paste a job posting URL or the full job description" value={input} onChange={(e) => setInput(e.target.value)} />
      <button className="btn" onClick={find} disabled={busy}>{busy ? 'Reading page…' : 'Find People'}</button>
      {err && <p className="err" role="alert">{err}</p>}
      {job && (
        <>
          <section className="card">
            <h2>{job.title || 'Untitled role'}{job.company ? ` at ${job.company}` : ''}</h2>
            <p className="hint">Check these details. Fix anything wrong and the searches update.</p>
            <div className="grid3">
              <label>Company<input value={job.company} onChange={edit('company')} /></label>
              <label>Job title<input value={job.title} onChange={edit('title')} /></label>
              <label>Location<input value={job.location} onChange={edit('location')} /></label>
            </div>
            <details><summary>Job details</summary><p className="details">{job.details}</p></details>
          </section>
          <h3>People to look for</h3>
          <p className="hint">These are search ideas, not confirmed people. JobContact AI never invents names or emails. Open a search, find someone real, then save them.</p>
          {done && <p className="ok" role="status">{done}</p>}
          {sugg.map((s) => (
            <section className="card" key={s.id}>
              <div className="row between"><h4>{s.role}</h4><span className="tag">{s.rank}</span></div>
              <p className="hint"><b>Guess:</b> {s.basis}.</p>
              <div className="row">
                <a className="btn small" href={s.search} target="_blank" rel="noreferrer">Search people</a>
                <a className="btn small ghost" href={s.emailSearch} target="_blank" rel="noreferrer">Search email</a>
                <button className="btn small ghost" onClick={() => setOpen(open === s.id ? '' : s.id)}>Save a contact</button>
              </div>
              {open === s.id && (
                <ContactForm initial={{ ...blank(), company: job.company, notes: `Found via: ${s.role} search` }} onCancel={() => setOpen('')}
                  onSave={(c) => { upsert(c); setOpen(''); setDone(`Saved ${c.name}.`); }} />
              )}
            </section>
          ))}
        </>
      )}
    </div>
  );
}

export function Contacts({ store }: { store: Store }) {
  const { list, upsert, remove } = useContacts(store);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Contact | null>(null);
  const shown = list.filter((c) => JSON.stringify(c).toLowerCase().includes(q.toLowerCase()));
  const exp = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toCSV(list)], { type: 'text/csv' }));
    a.download = 'jobcontact-contacts.csv'; a.click();
  };
  return (
    <div className="stack">
      <div className="row">
        <input className="grow" placeholder="Search contacts" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search contacts" />
        <button className="btn ghost" onClick={() => setEdit({ ...blank() })}>Add contact</button>
        <button className="btn" onClick={exp} disabled={!list.length}>Export CSV</button>
      </div>
      {edit && !edit.id && <section className="card"><ContactForm initial={edit} onCancel={() => setEdit(null)} onSave={(c) => { upsert(c); setEdit(null); }} /></section>}
      {!list.length && <p className="hint">No saved contacts yet. Analyze a job, search for a person, then save them here.</p>}
      {list.length > 0 && !shown.length && <p className="hint">No contacts match “{q}”.</p>}
      {shown.map((c) => (
        <section className="card" key={c.id}>
          {edit?.id === c.id ? (
            <ContactForm initial={edit} onCancel={() => setEdit(null)} onSave={(n) => { upsert(n); setEdit(null); }} />
          ) : (
            <>
              <div className="row between"><h4>{c.name}</h4><span className={`tag ${c.confidence}`}>{c.confidence}</span></div>
              <p>{[c.title, c.company].filter(Boolean).join(' at ')}</p>
              {c.email && <p>{c.email} <span className="hint">(unverified)</span></p>}
              {c.linkedin && <p><a href={c.linkedin} target="_blank" rel="noreferrer">LinkedIn profile</a></p>}
              {c.source && <p className="hint">Source: {c.source}</p>}
              {c.notes && <p className="hint">{c.notes}</p>}
              <div className="row">
                <button className="btn small ghost" onClick={() => setEdit(c)}>Edit</button>
                <button className="btn small danger" onClick={() => confirm(`Delete ${c.name}?`) && remove(c.id)}>Delete</button>
              </div>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
