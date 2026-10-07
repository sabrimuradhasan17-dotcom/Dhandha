import './globals.css';
import Link from 'next/link';
import { settings, seoFor } from '@/lib/queries.js';
import { SITE_URL } from '@/lib/util.js';
import { waUrl, JsonLd } from '@/components/Shared.js';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  const h = seoFor('home');
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: h.title || 'La Bhutanz Tours', template: '%s | La Bhutanz' },
    description: h.description,
    openGraph: { siteName: 'La Bhutanz Tours', type: 'website', locale: 'en_IN' },
    alternates: { canonical: '/' }
  };
}

export default function RootLayout({ children }) {
  const s = settings();
  return (
    <html lang="en-IN">
      <body>
        <header className="site"><div className="wrap">
          <Link className="logo" href="/">La Bhutanz<span>.</span></Link>
          <nav aria-label="Main">
            <Link href="/tours">Tours</Link><Link href="/destinations">Destinations</Link><Link href="/flights">Flights</Link><Link href="/blog">Blog</Link><Link href="/faq">FAQ</Link><Link href="/about">About</Link>
            <Link href="/plan" className="btn sm" style={{ color: '#fff', marginLeft: 18 }}>Plan my trip</Link>
          </nav></div></header>
        <main>{children}</main>
        <a className="btn wa float" target="_blank" rel="noopener" href={waUrl(s, 'Hi, I want to plan a Bhutan trip.')}>WhatsApp us</a>
        <footer><div className="wrap two">
          <div><h3>La Bhutanz Tours</h3><p style={{ opacity: .8 }}>Mumbai-based Bhutan specialists. Licensed Bhutan partners, private guides, handpicked stays.</p><p>{s.address}<br />{s.phone} · {s.email}</p></div>
          <div><Link href="/tours">All tours</Link><br /><Link href="/destinations">Destinations</Link><br /><Link href="/flights">Flights</Link><br /><Link href="/blog">Blog</Link><br /><Link href="/faq">FAQ</Link><br /><Link href="/plan">Plan my trip</Link></div>
        </div></footer>
        <JsonLd data={{ '@context': 'https://schema.org', '@type': 'TravelAgency', name: 'La Bhutanz Tours', url: SITE_URL, telephone: s.phone, email: s.email, areaServed: 'IN', address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressCountry: 'IN' } }} />
      </body>
    </html>
  );
}
