import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import '@jc/shared/styles.css';

export const metadata: Metadata = { title: 'JobContact AI', description: "Don't just apply. Find your way in." };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <nav className="nav"><div className="wrap">
        <b>JobContact <span>AI</span></b>
        <Link href="/">Home</Link><Link href="/analyze">Analyze a job</Link><Link href="/contacts">Saved contacts</Link><Link href="/about">About</Link>
      </div></nav>
      <main className="wrap">{children}</main>
    </body></html>
  );
}
