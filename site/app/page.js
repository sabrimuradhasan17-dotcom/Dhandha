import Link from 'next/link';
import { listTours, listPosts, listReviews, upcoming, seoFor, settings } from '@/lib/queries.js';
import { DEST, FAQ } from '@/lib/seed-data.js';
import { TourCard, PostCard, Stars, Cta, Faq, waUrl } from '@/components/Shared.js';
import Art from '@/components/Art.js';
import { inr, fmtDate } from '@/lib/util.js';

export function generateMetadata() { const s = seoFor('home'); return { title: { absolute: s.title }, description: s.description, alternates: { canonical: '/' } }; }

export default function Home() {
  const tours = listTours(), s = settings();
  const deps = tours.flatMap((t) => upcoming(t).map((d) => ({ ...d, t }))).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  return (
    <>
      <section className="hero" style={{ '--heroimg': 'linear-gradient(135deg,#4a1b12,#b88a2e)' }}><div className="wrap">
        <h1>Bhutan, planned around you</h1><p>Private guides, permits and handpicked stays. Real conversations, not cookie-cutter packages.</p>
        <form className="searchbar" action="/tours">
          <div><label htmlFor="d">Destination</label><select id="d" name="dest"><option value="">Any destination</option>{DEST.map((d) => <option key={d.slug}>{d.name}</option>)}</select></div>
          <div><label htmlFor="n">Duration</label><select id="n" name="days"><option value="">Any</option><option value="s">Up to 6 days</option><option value="m">7 to 8 days</option><option value="l">9+ days</option></select></div>
          <div><label htmlFor="b">Budget</label><select id="b" name="budget"><option value="">Any</option><option value="l">Under ₹40k</option><option value="m">₹40k to ₹70k</option><option value="h">₹70k+</option></select></div>
          <div><label>&nbsp;</label><button className="btn" style={{ width: '100%' }}>Find trips</button></div>
        </form></div></section>
      <div className="stripe"><div className="wrap"><div><b>{tours.length}</b>Live tours</div><div><b>5</b>Regions covered</div><div><b>Private</b>Guides and cars</div><div><b>24/7</b>WhatsApp support</div></div></div>
      <section className="sec wrap"><h2>Popular journeys</h2><div className="grid">{tours.slice(0, 3).map((t) => <TourCard key={t.id} t={t} />)}</div><p><Link href="/tours">See all tours →</Link></p></section>
      <section className="sec wrap"><h2>Where in Bhutan?</h2><div className="grid">{DEST.map((d) => (
        <Link key={d.slug} className="card" href={`/destinations/${d.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}><div className="img"><Art hue={d.hue} label={d.photo} scene={d.name.length} /></div><div className="body"><h3>{d.name}</h3><p className="muted">{d.known.join(' · ')}</p></div></Link>))}</div></section>
      <section className="sec wrap"><h2>How it works</h2><div className="grid steps">{[['Tell us your dream', 'Share dates, pace and interests on WhatsApp.'], ['We design your trip', 'Itinerary, hotels, guide and permits, with transparent INR pricing.'], ['Travel stress-free', 'We stay on call from airport pickup to farewell.']].map(([a, b]) => <div key={a} className="card body"><h3>{a}</h3><p className="muted">{b}</p></div>)}</div></section>
      {deps.length > 0 && <section className="sec wrap"><h2>Upcoming departures</h2><div className="tablewrap"><table><thead><tr><th>Date</th><th>Tour</th><th>Days</th><th>Price</th><th>Seats</th><th></th></tr></thead><tbody>{deps.map((d) => (
        <tr key={d.id}><td>{fmtDate(d.date)}</td><td><Link href={`/tours/${d.t.slug}`}>{d.t.name}</Link></td><td>{d.t.days}</td><td>{inr(d.price ?? d.t.price)}</td><td>{d.seats == null ? '-' : d.seats > 0 ? d.seats + ' left' : 'Sold out'}</td>
          <td><a className="btn wa sm" target="_blank" rel="noopener" href={waUrl(s, `Enquiry: ${d.t.name} departing ${fmtDate(d.date)}`)}>Book</a></td></tr>))}</tbody></table></div></section>}
      <section className="sec wrap"><h2>Traveller stories</h2><div className="grid">{listReviews().slice(0, 3).map((r) => <div key={r.id} className="card body"><Stars n={r.rating} /><p>“{r.text}”</p><div className="muted"><b>{r.name}</b> · {r.trip}</div></div>)}</div></section>
      <section className="sec wrap"><h2>From the blog</h2><div className="grid">{listPosts().slice(0, 3).map((p) => <PostCard key={p.id} p={p} />)}</div></section>
      <section className="sec wrap"><h2>Quick answers</h2><Faq items={FAQ.slice(0, 4)} /><Link href="/faq">More FAQs →</Link></section>
      <Cta s={s} />
    </>
  );
}
