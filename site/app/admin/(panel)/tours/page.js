import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { listTours, upcoming } from '@/lib/queries.js';
import { inr } from '@/lib/util.js';
import { Flash, Del } from '@/components/Admin.js';
import { deleteTour, setTourStatus } from '../../actions.js';
export default function Tours({ searchParams: q }) {
  const u = requireUser(), tours = listTours({ live: false });
  return <><Flash q={q} /><h1>Tours and prices</h1><p><Link className="btn sm" href="/admin/tours/new">+ Add tour</Link></p>
    <div className="tablewrap"><table><thead><tr><th>Tour</th><th>Days</th><th>Price</th><th>Upcoming dates</th><th>Status</th><th></th></tr></thead><tbody>{tours.map((t) => <tr key={t.id}>
      <td><Link href={`/admin/tours/${t.id}`}>{t.name}</Link></td><td>{t.days}</td><td>{inr(t.price)}</td><td>{upcoming(t).length}</td>
      <td><form action={setTourStatus}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="status" value={t.status === 'live' ? 'draft' : 'live'} /><button className={`badge ${t.status === 'live' ? '' : 'off'}`} style={{ border: 0, cursor: 'pointer' }} title="Click to toggle">{t.status}</button></form></td>
      <td><Link className="btn sm alt" href={`/admin/tours/${t.id}`}>Edit</Link> {u.role === 'owner' && <Del action={deleteTour} id={t.id} msg={`Delete “${t.name}”?`} />}</td></tr>)}</tbody></table></div></>;
}
