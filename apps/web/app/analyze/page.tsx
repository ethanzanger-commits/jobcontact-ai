'use client';
import { Analyzer, localStore } from '@jc/shared';

async function fetchUrl(url: string) {
  const r = await fetch('/api/fetch-job', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Couldn't read that page. Paste the job description instead.");
  return j;
}
export default function Analyze() {
  return <div><h1 style={{ fontSize: '1.8rem' }}>Analyze a job</h1><Analyzer store={localStore} fetchUrl={fetchUrl} /></div>;
}
