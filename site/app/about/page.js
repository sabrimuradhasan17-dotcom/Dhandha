import { seoFor, settings } from '@/lib/queries.js';
import { Crumbs, Cta } from '@/components/Shared.js';
export function generateMetadata() { const s = seoFor('about'); return { title: s.title, description: s.description, alternates: { canonical: '/about' } }; }
export default function About() {
  const s = settings();
  return <section className="sec wrap prose"><Crumbs items={[['About']]} /><h1>About La Bhutanz Tours</h1>
    <p>We are a Mumbai-based agency that focuses only on Bhutan, designing journeys for Indian and international travellers with licensed local partners and guides.</p>
    <h2>What we believe</h2><p>Fewer crowds, slower days and conversations with real people. Every itinerary starts with a chat, not a template.</p>
    <h2>Contact</h2><p>{s.address}<br />{s.phone} · {s.email}</p><Cta s={s} /></section>;
}
