import Link from 'next/link';
import Art from './Art.js';
import { inr, SITE_URL } from '@/lib/util.js';

export const waUrl = (s, text) => `https://wa.me/${String(s.wa || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
export const Stars = ({ n }) => <span className="stars" aria-label={`${n} out of 5 stars`}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
export function JsonLd({ data }) { return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />; }
export function Crumbs({ items }) {
  const all = [['Home', '/'], ...items];
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">{all.map(([l, h], i) => <span key={l}>{i > 0 && ' / '}{h ? <Link href={h}>{l}</Link> : l}</span>)}</nav>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: all.map(([l, h], i) => ({ '@type': 'ListItem', position: i + 1, name: l, ...(h ? { item: SITE_URL + h } : {}) })) }} />
    </>
  );
}
export function TourCard({ t }) {
  return (
    <Link className="card" href={`/tours/${t.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="img"><Art hue={t.hue} label={t.photo || t.name} image={t.image} scene={t.id} /></div>
      <div className="body">
        <h3>{t.name}</h3>
        <div className="muted">{t.days} days · {t.route}</div>
        <div className="chips">{t.highlights.map((h) => <span key={h}>{h}</span>)}</div>
        <div className="price">from {inr(t.price)} <span className="muted">per person</span></div>
      </div>
    </Link>
  );
}
export function PostCard({ p }) {
  return (
    <Link className="card" href={`/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="img"><Art hue={30 + (p.id % 6) * 55} label={p.title} scene={p.id} /></div>
      <div className="body"><h3>{p.title}</h3><p className="muted">{p.excerpt}</p></div>
    </Link>
  );
}
export function Cta({ s }) {
  return (
    <section className="sec wrap"><div className="cta"><h2>Ready for Bhutan?</h2><p>Tell us your dates and we will design the trip with you.</p>
      <Link className="btn" style={{ background: '#fff', color: 'var(--maroon)' }} href="/plan">Plan my trip</Link>{' '}
      <a className="btn wa" target="_blank" rel="noopener" href={waUrl(s, 'Hi, I want to plan a Bhutan trip.')}>Chat on WhatsApp</a></div></section>
  );
}
export const Faq = ({ items }) => items.map(([q, a]) => <details key={q}><summary>{q}</summary><p className="muted">{a}</p></details>);
