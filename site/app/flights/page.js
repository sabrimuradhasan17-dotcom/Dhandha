import { listFlights, seoFor, settings } from '@/lib/queries.js';
import { Crumbs, Cta, waUrl } from '@/components/Shared.js';
import { inr } from '@/lib/util.js';
export function generateMetadata() { const s = seoFor('flights'); return { title: s.title, description: s.description, alternates: { canonical: '/flights' } }; }
export default function Flights() {
  const f = listFlights(), s = settings();
  return <section className="sec wrap"><Crumbs items={[['Flights']]} /><h1>Flights to Paro</h1><p className="muted">Indicative schedule and fares. Confirm availability on WhatsApp before booking.</p>
    <div className="tablewrap"><table><thead><tr><th>Route</th><th>Airline</th><th>Flight</th><th>Dep</th><th>Arr</th><th>Days</th><th>Fare</th><th>Seats</th><th></th></tr></thead><tbody>{f.map((x) => (
      <tr key={x.id}><td>{x.route}</td><td>{x.airline}</td><td>{x.flight_no}</td><td>{x.dep}</td><td>{x.arr}</td><td>{x.days}</td><td>{inr(x.price)}</td><td>{x.seats > 5 ? 'Available' : x.seats > 0 ? `${x.seats} left` : 'Full'}</td>
        <td><a className="btn wa sm" target="_blank" rel="noopener" href={waUrl(s, `Enquiry: flight ${x.flight_no} ${x.route}`)}>Enquire</a></td></tr>))}</tbody></table></div><Cta s={s} /></section>;
}
