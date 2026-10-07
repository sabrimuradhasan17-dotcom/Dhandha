import { requireUser } from '@/lib/auth.js';
import { settings } from '@/lib/queries.js';
import { Flash, Field } from '@/components/Admin.js';
import { saveSettings } from '../../actions.js';
export default function Settings({ searchParams: q }) {
  requireUser('owner'); const s = settings();
  return <><Flash q={q} /><h1>Business settings</h1><form action={saveSettings} className="card body" style={{ maxWidth: 560 }}>
    <Field name="wa" label="WhatsApp number with country code (e.g. 919876543210). All enquiry buttons use this." def={s.wa} required /><Field name="phone" label="Phone shown on site" def={s.phone} /><Field name="email" label="Email shown on site" def={s.email} /><Field name="address" label="Address" def={s.address} /><p><button className="btn">Save settings</button></p></form></>;
}
