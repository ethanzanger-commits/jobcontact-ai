export default function About() {
  return (
    <div className="stack">
      <h1 style={{ fontSize: '1.8rem' }}>About</h1>
      <p>JobContact AI helps you reach a person at the company instead of only submitting another application.</p>
      <section className="card"><h4>What it does</h4><p>It reads a job, works out the department, and builds Google searches for likely decision makers. Every suggestion is a search idea, labeled as a guess until you find a real person.</p></section>
      <section className="card"><h4>What it never does</h4><p>It never invents names, titles or emails, never marks an email as verified, and never scrapes LinkedIn or interacts with it automatically.</p></section>
      <section className="card"><h4>Your data</h4><p>No accounts and no database. Contacts live in your browser’s local storage. The website and the Chrome extension store separately, so use CSV export to move contacts between them.</p></section>
    </div>
  );
}
