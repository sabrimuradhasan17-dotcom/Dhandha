import { Field } from '@/components/Admin.js';
import Counted from '@/components/Counted.js';
import { saveTour } from '../../actions.js';
export default function TourForm({ t }) {
  const v = t || { highlights: [], inclusions: [], itinerary: [], dates: [], status: 'draft' };
  return <form action={saveTour} encType="multipart/form-data">{t && <input type="hidden" name="id" value={t.id} />}
    <div className="two"><Field name="name" label="Tour name" def={v.name} required maxLength={140} /><Field name="price" label="Base price per person (INR)" type="number" def={v.price} required min="1" /></div>
    <div className="two"><Field name="route" label="Route (use place names: Paro, Thimphu…)" def={v.route} /><div><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={v.status}><option value="live">Live (visible on website)</option><option value="draft">Draft (hidden)</option></select></div></div>
    <Field name="highlights" label="Highlights (comma separated)" def={v.highlights.join(', ')} />
    <Field name="itinerary" label={'Itinerary: one day per line as "Title: description"'} area rows={8} def={v.itinerary.join('\n')} required />
    <Field name="inclusions" label="Inclusions (one per line)" area rows={4} def={v.inclusions.join('\n')} />
    <Field name="dates" label="Departure dates: one per line as YYYY-MM-DD | seats | price (seats and price optional)" area rows={5} def={v.dates.map((d) => [d.date, d.seats ?? '', d.price ?? ''].join(' | ').replace(/( \| )+$/, '')).join('\n')} placeholder={'2027-03-14 | 12 | 45000\n2027-04-02'} />
    <div className="two"><div><label htmlFor="image">Photo (JPG, PNG, WebP, max 5 MB)</label><input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />{v.image && <p><img className="thumb" src={`/uploads/${v.image}`} alt="" /> <label style={{ display: 'inline' }}><input type="checkbox" name="remove_image" value="1" style={{ width: 'auto' }} /> remove</label></p>}</div><Field name="photo" label="Photo description (alt text)" def={v.photo} /></div>
    <h3 style={{ marginTop: 20 }}>Google / SEO</h3><Field name="slug" label="URL slug (blank = from name)" def={v.slug} />
    <Counted name="seo_title" label="SEO title" max={60} defaultValue={v.seo_title} /><Counted name="seo_desc" label="SEO description" max={160} defaultValue={v.seo_desc} area />
    <p><button className="btn">Save tour</button></p></form>;
}
