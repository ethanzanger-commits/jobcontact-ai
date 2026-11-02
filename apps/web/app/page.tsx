import Link from 'next/link';
export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1>Don’t just apply. Find your way in.</h1>
        <p>Paste a job posting and get targeted searches for the hiring manager, team leaders, recruiters and teammates at that company.</p>
        <p><Link className="btn" href="/analyze">Analyze a job</Link></p>
      </section>
      <div className="grid3">
        <div className="card"><h4>Paste a job</h4><p className="hint">Use a posting link or the full description.</p></div>
        <div className="card"><h4>Get search links</h4><p className="hint">Up to five people to look for, with Google searches written from the job itself.</p></div>
        <div className="card"><h4>Save contacts</h4><p className="hint">Keep notes and export everything to CSV.</p></div>
      </div>
    </div>
  );
}
