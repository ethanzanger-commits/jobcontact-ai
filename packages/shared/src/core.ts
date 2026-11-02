export type Confidence = 'Confirmed' | 'Likely' | 'Guess';
export type Hints = { title?: string; company?: string; location?: string };
export type Job = { company: string; title: string; location: string; details: string; url: string };
export type Suggestion = { id: string; rank: string; role: string; search: string; emailSearch: string; basis: string };
export type Contact = { id: string; name: string; title: string; company: string; email: string; linkedin: string; source: string; notes: string; confidence: Confidence; createdAt: number };
export type Store = { load(): Promise<Contact[]>; save(c: Contact[]): Promise<void> };

export const localStore: Store = {
  async load() { try { return JSON.parse(localStorage.getItem('jobcontact.contacts') || '[]'); } catch { return []; } },
  async save(c) { localStorage.setItem('jobcontact.contacts', JSON.stringify(c)); },
};

const pretty = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function companyFromUrl(u: string): string {
  try {
    const x = new URL(u);
    const h = x.hostname.replace(/^www\./, '');
    const p = x.pathname.split('/').filter(Boolean);
    if (/(greenhouse\.io|lever\.co)$/.test(h)) return pretty(p[0] || '');
    if (/comeet\.com$/.test(h)) return pretty(p[0] === 'jobs' ? p[1] || '' : p[0] || '');
    if (/myworkdayjobs\.com$/.test(h)) return pretty(h.split('.')[0]);
    if (/linkedin\.com$/.test(h)) return '';
    const parts = h.split('.');
    const i = /^(co|com|org|net)$/.test(parts[parts.length - 2]) ? -3 : -2;
    return pretty(parts.slice(i)[0] || '');
  } catch { return ''; }
}

const DEPTS: [RegExp, string][] = [
  [/paid|performance|ppc|\bsem\b|media buy|acquisition|growth market/i, 'Performance Marketing'],
  [/partner|alliance|bizdev|business development/i, 'Partnerships'],
  [/content|brand|social|\bseo\b|market/i, 'Marketing'],
  [/engineer|developer|devops|backend|frontend|full.?stack|software|\bqa\b/i, 'Engineering'],
  [/\bproduct\b/i, 'Product'],
  [/\bdata\b|analyst|machine learning|\bml\b/i, 'Data'],
  [/sales|account exec|\bsdr\b|\bbdr\b|revenue/i, 'Sales'],
  [/customer success|support|account manag/i, 'Customer Success'],
  [/design|\bux\b|\bui\b/i, 'Design'],
  [/finance|accounting|fp&a/i, 'Finance'],
  [/recruit|talent|people|\bhr\b/i, 'People'],
];
export const detectDept = (title: string) => DEPTS.find(([r]) => r.test(title))?.[1] ?? '';

export function parseJob(raw: string, url = '', h: Hints = {}): Job {
  const lines = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  let title = h.title || '';
  let company = h.company || '';
  if (!title) {
    const m = lines[0]?.match(/^(.{3,90}?)\s+(?:at|@|\|)\s+(.{2,60})$/i);
    if (m) { title = m[1]; company = company || m[2]; } else title = (lines[0] || '').slice(0, 100);
  }
  company = company || companyFromUrl(url);
  const loc = h.location || raw.match(/(?:location|where)\s*[:\-]\s*([^\n]{2,60})/i)?.[1] || '';
  return { company: company.trim(), title: title.trim(), location: loc.trim(), details: raw.trim().slice(0, 1500), url };
}

const g = (q: string) => 'https://www.google.com/search?q=' + encodeURIComponent(q);

export function suggest(j: Job): Suggestion[] {
  const c = j.company ? `"${j.company}"` : '';
  const d = detectDept(j.title) || j.title;
  const rows: [string, string, string, string][] = [
    ['Likely hiring manager', `${c} "Head of ${d}" OR "Director of ${d}"`, `${c} "Head of ${d}" email`, 'Inferred from the job title'],
    ['Direct team manager', `${c} "${d} Manager" OR "${d} Team Lead"`, `${c} "${d} Manager" email`, 'Inferred from the job title'],
    ['Department leader', `${c} "VP ${d}" OR "VP of ${d}" OR "Chief ${d} Officer"`, `${c} "VP ${d}" email`, 'Inferred from the department'],
    ['Recruiter', `${c} ${d} (recruiter OR "talent acquisition")`, `${c} ${d} recruiter email`, 'Typical for hiring at this company'],
    ['Current team member', `${c} "${d}" ${j.title} site:linkedin.com/in`, `${c} ${d} team email`, 'Public profiles only; you open the results yourself'],
  ];
  return rows.map(([role, s, e, basis], i) => ({ id: String(i), rank: `Priority ${i + 1}`, role, search: g(s.replace(/\s+/g, ' ').trim()), emailSearch: g(e.replace(/\s+/g, ' ').trim()), basis }));
}

const COLS: (keyof Contact)[] = ['name', 'title', 'company', 'email', 'linkedin', 'source', 'notes', 'confidence'];
const cell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
export const toCSV = (cs: Contact[]) => [COLS.join(','), ...cs.map((c) => COLS.map((k) => cell(c[k])).join(','))].join('\n');
