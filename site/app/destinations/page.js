import Link from 'next/link';
import { DEST } from '@/lib/seed-data.js';
import { seoFor, settings } from '@/lib/queries.js';
import { Crumbs, Cta } from '@/components/Shared.js';
import Art from '@/components/Art.js';
export function generateMetadata() { const s = seoFor('destinations'); return { title: s.title, description: s.description, alternates: { canonical: '/destinations' } }; }
export default function Dests() {
  return <section className="sec wrap"><Crumbs items={[['Destinations']]} /><h1>Bhutan destinations</h1><div className="grid">{DEST.map((d) => (
    <Link key={d.slug} className="card" href={`/destinations/${d.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}><div className="img"><Art hue={d.hue} label={d.photo} scene={d.name.length} /></div><div className="body"><h3>{d.name}</h3><p className="muted">{d.blurb}</p></div></Link>))}</div><Cta s={settings()} /></section>;
}
