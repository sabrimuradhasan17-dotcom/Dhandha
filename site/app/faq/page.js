import { FAQ } from '@/lib/seed-data.js';
import { seoFor, settings } from '@/lib/queries.js';
import { Crumbs, Cta, Faq, JsonLd } from '@/components/Shared.js';
export function generateMetadata() { const s = seoFor('faq'); return { title: s.title, description: s.description, alternates: { canonical: '/faq' } }; }
export default function FaqPage() {
  return <section className="sec wrap"><Crumbs items={[['FAQ']]} /><h1>Frequently asked questions</h1>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }} />
    <Faq items={FAQ} /><Cta s={settings()} /></section>;
}
