import { db } from './db.js';
import { config } from './config.js';

export const smsEnabled = () => Boolean(config.twilioSid && config.twilioToken && config.twilioFrom);
/** Messages "sent" in mock mode (dev/tests). */
export const outbox = [];

const e164 = (phone) => (phone.startsWith('+') ? phone : `${config.countryCode}${phone}`);

export async function sendSms(phone, body) {
  if (!smsEnabled()) {
    outbox.push({ to: phone, body });
    console.log(`[sms mock] -> ${phone}: ${body}`);
    return;
  }
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.twilioSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.twilioSid}:${config.twilioToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: e164(phone), From: config.twilioFrom, Body: body }),
  });
  if (!r.ok) throw new Error(`Twilio ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

/** Text each offered worker about a new job request. Fire-and-forget. */
export function notifyNewRequest(bookingId, workerIds) {
  const b = db
    .prepare(
      `SELECT b.address, b.scheduled_at, b.amount, b.commission, s.name AS service
       FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.id = ?`,
    )
    .get(bookingId);
  if (!b) return;
  const when = new Date(b.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const body = `Dhandha: new ${b.service} request on ${when} at ${b.address.slice(0, 60)}. You earn Rs ${b.amount - b.commission}. Open the app to accept.`;
  for (const id of workerIds) {
    const u = db.prepare('SELECT phone FROM users WHERE id = ?').get(id);
    if (u) sendSms(u.phone, body).catch((e) => console.error('SMS failed for worker', id, e.message));
  }
}
