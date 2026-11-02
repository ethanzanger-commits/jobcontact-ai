/** Injected into the active tab by the extension. Must stay self-contained. */
export function extractPage() {
  const q = (s: string) => document.querySelector(s)?.textContent?.trim() || '';
  let title = '', company = '', loc = '';
  for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      let d: any = JSON.parse(s.textContent || '');
      d = Array.isArray(d) ? d : d['@graph'] || [d];
      const j = d.find((x: any) => x && x['@type'] === 'JobPosting');
      if (j) {
        title = j.title || ''; company = j.hiringOrganization?.name || '';
        const l = Array.isArray(j.jobLocation) ? j.jobLocation[0] : j.jobLocation;
        const a = l?.address;
        loc = [a?.addressLocality, a?.addressCountry?.name || a?.addressCountry].filter((x: any) => typeof x === 'string').join(', ');
        break;
      }
    } catch { /* ignore */ }
  }
  title = title || q('.job-details-jobs-unified-top-card__job-title') || q('.top-card-layout__title') || q('h1') || document.title;
  company = company || q('.job-details-jobs-unified-top-card__company-name') || q('.topcard__org-name-link') ||
    (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement | null)?.content || '';
  const root = (document.querySelector('main') || document.body) as HTMLElement;
  return { title, company, location: loc, url: window.location.href, text: (root.innerText || '').slice(0, 6000) };
}
