import Link from 'next/link';
import { listTours, seoFor, settings } from '@/lib/queries.js';
import { DEST } from '@/lib/seed-data.js';
import { TourCard, Crumbs, Cta } from '@/components/Shared.js';

export function generateMetadata() { const s = seoFor('tours'); return { title: s.title, description: s.description, alternates: { canonical: '/tours' } }; }

export default function Tours({ searchParams: q }) {
  let a = listTours();
  a = a.filter((t) => (!q.dest || t.route.includes(q.dest)) &&
    (!q.days || (q.days === 's' ? t.days <= 6 : q.days === 'm' ? t.days >= 7 && t.days <= 8 : t.days >= 9)) &&
    (!q.budget || (q.budget === 'l' ? t.price < 40000 : q.budget === 'm' ? t.price >= 40000 && t.price < 70000 : t.price >= 70000)));
  if (q.sort === 'lo') a.sort((x, y) => x.price - y.price); if (q.sort === 'hi') a.sort((x, y) => y.price - x.price);
  const sel = (n, label, opts) => <div><label htmlFor={n}>{label}</label><select id={n} name={n} defaultValue={q[n] || ''}>{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>;
  return (
    <section className="sec wrap"><Crumbs items={[['Tours']]} /><h1>Bhutan tour packages</h1><p className="muted">Per-person prices in INR.</p>
      <form className="filters" action="/tours">
        {sel('dest', 'Destination', [['', 'Any destination'], ...DEST.map((d) => [d.name, d.name])])}
        {sel('days', 'Duration', [['', 'Any'], ['s', 'Up to 6 days'], ['m', '7 to 8 days'], ['l', '9+ days']])}
        {sel('budget', 'Budget', [['', 'Any'], ['l', 'Under ₹40k'], ['m', '₹40k to ₹70k'], ['h', '₹70k+']])}
        {sel('sort', 'Sort', [['', 'Recommended'], ['lo', 'Price: low to high'], ['hi', 'Price: high to low']])}
        <div><label>&nbsp;</label><button className="btn" style={{ width: '100%' }}>Apply</button></div>
        <div><label>&nbsp;</label><Link className="btn alt" style={{ width: '100%', textAlign: 'center' }} href="/tours">Clear</Link></div>
      </form>
      {a.length ? <div className="grid">{a.map((t) => <TourCard key={t.id} t={t} />)}</div> : <p>No tours match. <Link href="/plan">Ask us for a custom trip.</Link></p>}
      <Cta s={settings()} /></section>
  );
}
