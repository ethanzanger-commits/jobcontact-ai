import { NextResponse } from 'next/server';

const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[)/;
const fail = (error: string, status = 422) => NextResponse.json({ error }, { status });
const paste = 'Paste the job description instead.';

function ok(u: URL) {
  return /^https?:$/.test(u.protocol) && u.hostname.includes('.') && !PRIVATE.test(u.hostname);
}
async function get(u: URL) {
  for (let i = 0; i < 4; i++) {
    if (!ok(u)) throw new Error('blocked');
    const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 JobContactAI' }, signal: AbortSignal.timeout(8000), redirect: 'manual' });
    const loc = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && loc) { u = new URL(loc, u); continue; }
    if (!r.ok) throw new Error('status');
    return (await r.text()).slice(0, 1_500_000);
  }
  throw new Error('redirects');
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const u = new URL(url);
    if (!ok(u)) return fail('That link can’t be read. ' + paste);
    if (/linkedin\.com$/.test(u.hostname)) return fail('JobContact AI doesn’t read LinkedIn pages. ' + paste);
    const html = await get(u);
    const hints: { title?: string; company?: string; location?: string } = {};
    for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        let d = JSON.parse(m[1]); d = Array.isArray(d) ? d : d['@graph'] || [d];
        const j = d.find((x: any) => x?.['@type'] === 'JobPosting');
        if (j) {
          hints.title = j.title; hints.company = j.hiringOrganization?.name;
          const a = (Array.isArray(j.jobLocation) ? j.jobLocation[0] : j.jobLocation)?.address;
          hints.location = [a?.addressLocality, a?.addressCountry?.name || a?.addressCountry].filter((x: any) => typeof x === 'string').join(', ');
          break;
        }
      } catch { /* ignore */ }
    }
    hints.title ||= html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)?.[1] || html.match(/<title[^>]*>([^<]*)</i)?.[1]?.trim();
    hints.company ||= html.match(/<meta[^>]+property="og:site_name"[^>]+content="([^"]*)"/i)?.[1];
    const text = html
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h\d|tr)>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
      .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim().slice(0, 6000);
    if (text.length < 300 && !hints.title) return fail('This page loads its content with JavaScript, so it can’t be read from here. ' + paste);
    return NextResponse.json({ text, hints });
  } catch {
    return fail('Couldn’t read that page. ' + paste);
  }
}
