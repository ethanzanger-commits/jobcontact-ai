'use client';
import { Contacts, localStore } from '@jc/shared';
export default function Page() {
  return <div><h1 style={{ fontSize: '1.8rem' }}>Saved contacts</h1><p className="hint">Stored only in this browser. Clearing site data removes them, so export a CSV to keep a copy.</p><Contacts store={localStore} /></div>;
}
