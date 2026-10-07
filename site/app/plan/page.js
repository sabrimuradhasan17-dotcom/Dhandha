import { listTours, seoFor } from '@/lib/queries.js';
import { Crumbs } from '@/components/Shared.js';
import { submitEnquiry } from '../actions.js';
export function generateMetadata() { const s = seoFor('plan'); return { title: s.title, description: s.description, alternates: { canonical: '/plan' } }; }
export default function Plan({ searchParams: q }) {
  const tours = listTours();
  return <section className="sec wrap"><Crumbs items={[['Plan my trip']]} /><h1>Plan your Bhutan trip</h1>
    <p className="muted">Fill this in. We save your enquiry and open WhatsApp with everything prefilled.</p>
    {q.error && <p className="bad" role="alert">{q.error}</p>}
    <div className="card body" style={{ maxWidth: 640 }}><form action={submitEnquiry}>
      <input name="website" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true" />
      <div className="two"><div><label htmlFor="name">Name</label><input id="name" name="name" required maxLength={80} /></div><div><label htmlFor="phone">Phone / WhatsApp</label><input id="phone" name="phone" required inputMode="tel" maxLength={20} /></div>
        <div><label htmlFor="pax">Travellers</label><input id="pax" name="pax" type="number" min="1" max="99" defaultValue="2" /></div><div><label htmlFor="when">Preferred month</label><input id="when" name="when" placeholder="e.g. December" maxLength={40} /></div>
        <div><label htmlFor="budget">Budget per person</label><select id="budget" name="budget"><option>Under ₹40k</option><option>₹40k to ₹70k</option><option>₹70k+</option></select></div>
        <div><label htmlFor="tour">Tour or interest</label><select id="tour" name="tour" defaultValue={q.tour || 'Custom trip'}><option>Custom trip</option>{tours.map((t) => <option key={t.id}>{t.name}</option>)}</select></div></div>
      <label htmlFor="message">Notes</label><textarea id="message" name="message" maxLength={800} placeholder="Festivals, trekking, family, honeymoon…" />
      <p><button className="btn wa">Send on WhatsApp</button></p></form></div></section>;
}
