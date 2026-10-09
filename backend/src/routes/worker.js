import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { acceptOffer, declineOffer, haversineKm } from '../dispatch.js';
import { getBooking } from './bookings.js';

const r = Router();
r.use(requireAuth('worker'));

const NEXT = { assigned: 'on_the_way', on_the_way: 'in_progress', in_progress: 'completed' };

r.put('/availability', (req, res) => {
  const { available, lat, lng } = req.body || {};
  const w = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.user.id);
  if (!w.approved) return res.status(403).json({ error: 'Your account is awaiting admin approval' });
  const hasLoc = typeof lat === 'number' && typeof lng === 'number';
  if (available && !hasLoc && w.lat == null)
    return res.status(400).json({ error: 'lat and lng are required to go online' });
  db.prepare(
    `UPDATE workers SET available = ?, lat = COALESCE(?, lat), lng = COALESCE(?, lng),
       location_updated_at = CASE WHEN ? THEN datetime('now') ELSE location_updated_at END WHERE user_id = ?`,
  ).run(available ? 1 : 0, hasLoc ? lat : null, hasLoc ? lng : null, hasLoc ? 1 : 0, req.user.id);
  res.json(db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.user.id));
});

r.put('/profile', (req, res) => {
  const { bio = '', experienceYears = 0 } = req.body || {};
  if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 60)
    return res.status(400).json({ error: 'experienceYears must be 0-60' });
  db.prepare('UPDATE workers SET bio = ?, experience_years = ? WHERE user_id = ?').run(String(bio).slice(0, 500), experienceYears, req.user.id);
  res.json(db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.user.id));
});

r.put('/location', (req, res) => {
  const { lat, lng } = req.body || {};
  if (typeof lat !== 'number' || typeof lng !== 'number') return res.status(400).json({ error: 'lat and lng required' });
  db.prepare(`UPDATE workers SET lat = ?, lng = ?, location_updated_at = datetime('now') WHERE user_id = ?`).run(
    lat,
    lng,
    req.user.id,
  );
  res.json({ ok: true });
});

r.get('/offers', (req, res) => {
  const w = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(req.user.id);
  const rows = db
    .prepare(
      `SELECT b.id, s.name AS service_name, b.address, b.lat, b.lng, b.scheduled_at, b.notes, b.amount,
              b.commission, b.payment_method, (b.requested_worker_id = o.worker_id) AS direct
       FROM offers o JOIN bookings b ON b.id = o.booking_id JOIN services s ON s.id = b.service_id
       WHERE o.worker_id = ? AND o.status = 'pending' AND b.status = 'searching' ORDER BY b.scheduled_at`,
    )
    .all(req.user.id)
    .map((o) => ({
      ...o,
      earning: o.amount - o.commission,
      distance_km: w.lat == null ? null : Number(haversineKm(w.lat, w.lng, o.lat, o.lng).toFixed(1)),
    }));
  res.json(rows);
});

r.post('/offers/:id/accept', (req, res) => {
  if (!acceptOffer(Number(req.params.id), req.user.id))
    return res.status(409).json({ error: 'This job is no longer available' });
  res.json(getBooking(Number(req.params.id)));
});

r.post('/offers/:id/decline', (req, res) => {
  if (!declineOffer(Number(req.params.id), req.user.id)) return res.status(404).json({ error: 'Offer not found' });
  res.json({ ok: true });
});

r.get('/jobs', (req, res) => {
  const rows = db
    .prepare(
      `SELECT b.id FROM bookings b WHERE b.worker_id = ? ORDER BY b.scheduled_at DESC`,
    )
    .all(req.user.id);
  res.json(rows.map((x) => getBooking(x.id)));
});

r.post('/jobs/:id/advance', (req, res) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id = ? AND worker_id = ?').get(Number(req.params.id), req.user.id);
  if (!b) return res.status(404).json({ error: 'Job not found' });
  const next = NEXT[b.status];
  if (!next) return res.status(409).json({ error: `Cannot advance a ${b.status} job` });
  // Cash is collected by the worker at the door, so completing the job settles it.
  const settle = next === 'completed' && b.payment_method === 'cash' ? `, payment_status = 'paid'` : '';
  if (next === 'completed' && b.payment_method === 'online' && b.payment_status !== 'paid')
    return res.status(409).json({ error: 'Customer has not completed the online payment yet' });
  db.prepare(`UPDATE bookings SET status = ?${settle} WHERE id = ?`).run(next, b.id);
  res.json(getBooking(b.id));
});

r.get('/earnings', (req, res) => {
  const t = db
    .prepare(
      `SELECT COUNT(*) AS jobs,
              COALESCE(SUM(amount - commission), 0) AS earned,
              COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN commission END), 0) AS commission_owed_on_cash,
              COALESCE(SUM(CASE WHEN payment_method = 'online' THEN amount - commission END), 0) AS payable_from_online
       FROM bookings WHERE worker_id = ? AND status = 'completed'`,
    )
    .get(req.user.id);
  res.json(t);
});

export default r;
