import { notFound } from 'next/navigation';
import { DEST } from '@/lib/seed-data.js';
import { listTours, settings } from '@/lib/queries.js';
import { Crumbs, TourCard, Cta, JsonLd } from '@/components/Shared.js';
import Art from '@/components/Art.js';
import { SITE_URL } from '@/lib/util.js';
export function generateMetadata({ params }) { const d = DEST.find((x) => x.slug === params.slug); return d ? { title: `${d.name}, Bhutan: Guide and Tours`, description: d.blurb, alternates: { canonical: `/destinations/${d.slug}` } } : {}; }
export default function Dest({ params }) {
  const d = DEST.find((x) => x.slug === params.slug); if (!d) notFound();
  const ts = listTours().filter((t) => t.route.includes(d.name));
  return <section className="sec wrap"><Crumbs items={[['Destinations', '/destinations'], [d.name]]} />
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'TouristDestination', name: d.name, description: d.blurb, url: `${SITE_URL}/destinations/${d.slug}`, touristType: 'Leisure' }} />
    <div className="two"><div className="card"><Art hue={d.hue} label={d.photo} scene={d.name.length} /></div><div><h1>{d.name}</h1><p>{d.blurb}</p><p><b>Best time:</b> {d.best}</p><div className="chips">{d.known.map((k) => <span key={k}>{k}</span>)}</div></div></div>
    <h2 style={{ marginTop: 32 }}>Tours via {d.name}</h2>{ts.length ? <div className="grid">{ts.map((t) => <TourCard key={t.id} t={t} />)}</div> : <p className="muted">Custom trips available.</p>}<Cta s={settings()} /></section>;
}
