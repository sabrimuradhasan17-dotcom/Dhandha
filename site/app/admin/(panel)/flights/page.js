import { requireUser } from '@/lib/auth.js';
import { listFlights } from '@/lib/queries.js';
import { Flash, Field, Del } from '@/components/Admin.js';
import { saveFlight, deleteFlight } from '../../actions.js';
import { inr } from '@/lib/util.js';
function FlightForm({ f = {}, label }) {
  return <form action={saveFlight} className="card body" style={{ marginBottom: 12 }}>{f.id && <input type="hidden" name="id" value={f.id} />}
    <div className="two"><Field name="route" label="Route" def={f.route} required /><Field name="airline" label="Airline" def={f.airline} /><Field name="flight_no" label="Flight no." def={f.flight_no} /><Field name="days" label="Operating days" def={f.days} />
      <Field name="dep" label="Departure" type="time" def={f.dep} /><Field name="arr" label="Arrival" type="time" def={f.arr} /><Field name="price" label="Fare (INR)" type="number" def={f.price} min="0" /><Field name="seats" label="Seats left" type="number" def={f.seats} min="0" /></div>
    <p><label style={{ display: 'inline' }}><input type="checkbox" name="active" defaultChecked={f.id ? !!f.active : true} style={{ width: 'auto' }} /> Show on website</label></p><button className="btn sm">{label}</button></form>;
}
export default function Flights({ searchParams: q }) {
  const u = requireUser(), fl = listFlights({ active: false });
  return <><Flash q={q} /><h1>Flights</h1><details open><summary>+ Add flight</summary><FlightForm label="Add flight" /></details>
    {fl.map((f) => <details key={f.id}><summary>{f.route} · {f.airline} {f.flight_no} · {inr(f.price)} {!f.active && <span className="badge off">hidden</span>}</summary><FlightForm f={f} label="Save changes" />{u.role === 'owner' && <Del action={deleteFlight} id={f.id} />}</details>)}</>;
}
