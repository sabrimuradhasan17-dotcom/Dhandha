import { requireUser } from '@/lib/auth.js';
import { listReviews } from '@/lib/queries.js';
import { Flash, Field, Del } from '@/components/Admin.js';
import { saveReview, deleteReview } from '../../actions.js';
function ReviewForm({ r = {}, label }) {
  return <form action={saveReview} className="card body" style={{ marginBottom: 12 }}>{r.id && <input type="hidden" name="id" value={r.id} />}
    <div className="two"><Field name="name" label="Name" def={r.name} required /><Field name="trip" label="Trip" def={r.trip} /><Field name="rating" label="Rating (1 to 5)" type="number" min="1" max="5" def={r.rating ?? 5} /><div><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={r.status || 'live'}><option value="live">Live</option><option value="draft">Hidden</option></select></div></div>
    <Field name="text" label="Review" area def={r.text} /><p><button className="btn sm">{label}</button></p></form>;
}
export default function Reviews({ searchParams: q }) {
  const u = requireUser(), rs = listReviews({ live: false });
  return <><Flash q={q} /><h1>Reviews</h1><p className="muted">Only add real reviews from real customers.</p><details><summary>+ Add review</summary><ReviewForm label="Add review" /></details>
    {rs.map((r) => <details key={r.id}><summary>{r.name} · {r.trip} · {'★'.repeat(r.rating)} {r.status !== 'live' && <span className="badge off">hidden</span>}</summary><ReviewForm r={r} label="Save changes" />{u.role === 'owner' && <Del action={deleteReview} id={r.id} />}</details>)}</>;
}
