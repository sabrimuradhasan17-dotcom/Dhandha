import { all } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';
import { Flash, Del } from '@/components/Admin.js';
import { setEnquiryStatus, deleteEnquiry } from '../../actions.js';
export default function Enquiries({ searchParams: q }) {
  const u = requireUser(), rows = all('SELECT * FROM enquiries ORDER BY id DESC LIMIT 200');
  return <><Flash q={q} /><h1>Enquiries</h1>{rows.length ? <div className="tablewrap"><table><thead><tr><th>When</th><th>Name</th><th>Phone</th><th>Interest</th><th>Trip</th><th>Pax</th><th>Notes</th><th>Status</th><th></th></tr></thead><tbody>{rows.map((e) => <tr key={e.id}>
    <td>{e.created_at?.slice(0, 10)}</td><td>{e.name}</td><td>{e.phone && <a href={`https://wa.me/${e.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener">{e.phone}</a>}</td><td>{e.tour}</td><td>{e.when_text}</td><td>{e.pax}</td><td style={{ maxWidth: 220 }}>{e.message}</td>
    <td><form action={setEnquiryStatus} style={{ display: 'flex', gap: 4 }}><input type="hidden" name="id" value={e.id} /><select name="status" defaultValue={e.status}>{['new', 'contacted', 'booked', 'lost'].map((s) => <option key={s}>{s}</option>)}</select><button className="btn sm">Save</button></form></td>
    <td>{u.role === 'owner' && <Del action={deleteEnquiry} id={e.id} />}</td></tr>)}</tbody></table></div> : <p className="muted">No enquiries yet. They appear here when someone uses “Plan my trip”.</p>}</>;
}
