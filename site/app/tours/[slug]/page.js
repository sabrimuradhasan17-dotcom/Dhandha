import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tourBySlug, listTours, upcoming, settings } from '@/lib/queries.js';
import { Crumbs, TourCard, JsonLd, waUrl } from '@/components/Shared.js';
import Art from '@/components/Art.js';
import { inr, fmtDate, SITE_URL } from '@/lib/util.js';

export function generateMetadata({ params }) {
  const t = tourBySlug(params.slug); if (!t) return {};
  return { title: t.seo_title || t.name, description: t.seo_desc || t.highlights.join(', '), alternates: { canonical: `/tours/${t.slug}` },
    openGraph: { title: t.seo_title || t.name, description: t.seo_desc || '', images: t.image ? [`/uploads/${t.image}`] : [] } };
}

export default function Tour({ params }) {
  const t = tourBySlug(params.slug); if (!t) notFound();
  const s = settings(), dates = upcoming(t), rel = listTours().filter((x) => x.id !== t.id).slice(0, 3);
  return (
    <section className="sec wrap"><Crumbs items={[['Tours', '/tours'], [t.name]]} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'TouristTrip', name: t.name, description: t.seo_desc, touristType: 'Leisure', itinerary: { '@type': 'ItemList', itemListElement: t.itinerary.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.split(':')[0] })) }, offers: { '@type': 'Offer', price: t.price, priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: `${SITE_URL}/tours/${t.slug}` }, provider: { '@type': 'TravelAgency', name: 'La Bhutanz Tours' } }} />
      <div className="two"><div className="card"><Art hue={t.hue} label={t.photo || t.name} image={t.image} scene={t.id} priority /></div>
        <div><h1>{t.name}</h1><p className="muted">{t.days} days · {t.route}</p><div className="price">{inr(t.price)} <span className="muted">per person</span></div><div className="chips">{t.highlights.map((h) => <span key={h}>{h}</span>)}</div></div></div>
      <div className="two" style={{ marginTop: 28, alignItems: 'start' }}>
        <div><h2>Day by day</h2>{t.itinerary.map((l, i) => { const [a, ...b] = l.split(':'); return <div className="day" key={i}><b className="n">Day {i + 1}</b><div><b>{a}</b><br /><span className="muted">{b.join(':').trim()}</span></div></div>; })}
          <h2 style={{ marginTop: 28 }}>Included</h2><ul>{t.inclusions.map((i) => <li key={i}>{i}</li>)}</ul></div>
        <div className="card body sticky"><h3>Departure dates</h3>
          {dates.length ? dates.map((d) => <p key={d.id}><b>{fmtDate(d.date)}</b> · {inr(d.price ?? t.price)}{d.seats != null && <span className="muted"> · {d.seats > 0 ? `${d.seats} seats left` : 'Sold out'}</span>}{' '}
            {d.seats !== 0 && <a className="btn wa sm" target="_blank" rel="noopener" href={waUrl(s, `Enquiry: ${t.name} departing ${fmtDate(d.date)}`)}>Enquire</a>}</p>) : <p className="muted">Dates on request.</p>}
          <p><a className="btn wa" target="_blank" rel="noopener" href={waUrl(s, 'Hi, I am interested in ' + t.name)}>Chat on WhatsApp</a></p>
          <p><Link href={`/plan?tour=${encodeURIComponent(t.name)}`}>Send an enquiry instead →</Link></p>
          <p className="muted">Prices are per person on twin sharing. Subject to season.</p></div></div>
      {rel.length > 0 && <><h2 style={{ marginTop: 36 }}>You may also like</h2><div className="grid">{rel.map((x) => <TourCard key={x.id} t={x} />)}</div></>}
    </section>
  );
}
