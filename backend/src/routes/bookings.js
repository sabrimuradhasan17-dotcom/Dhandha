import { Router } from 'express';
import { db } from '../db.js';
import { config } from '../config.js';
import { requireAuth } from '../auth.js';
import { dispatchBooking } from '../dispatch.js';
import { refund } from '../payments.js';

const r = Router();

const VIEW = `
  SELECT b.*, s.name AS service_name, c.name AS category_name,
         wu.name AS worker_name, wu.phone AS worker_phone,
         cu.name AS customer_name,
         rt.rating, rt.comment AS review
  FROM bookings b
  JOIN services s ON s.id = b.service_id
  JOIN categories c ON c.id = s.category_id
  JOIN users cu ON cu.id = b.customer_id
  LEFT JOIN users wu ON wu.id = b.worker_id
  LEFT JOIN ratings rt ON rt.booking_id = b.id`;

export const getBooking = (id) => db.prepare(`${VIEW} WHERE b.id = ?`).get(id);

r.post('/', requireAuth('customer'), (req, res) => {
  const { serviceId, address, lat, lng, scheduledAt, notes = '', paymentMethod } = req.body || {};
  const svc = db.prepare('SELECT * FROM services WHERE id = ? AND active = 1').get(serviceId);
  if (!svc) return res.status(400).json({ error: 'Unknown service' });
  if (!address || typeof lat !== 'number' || typeof lng !== 'number')
    return res.status(400).json({ error: 'address, lat and lng are required' });
  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime()) || when.getTime() < Date.now())
    return res.status(400).json({ error: 'scheduledAt must be a future ISO date' });
  if (!['online', 'cash'].includes(paymentMethod))
    return res.status(400).json({ error: "paymentMethod must be 'online' or 'cash'" });

  const commission = Math.round((svc.price * config.commissionPercent) / 100);
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO bookings (customer_id, service_id, address, lat, lng, scheduled_at, notes, amount, commission, payment_method)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
    )
    .run(req.user.id, svc.id, address, lat, lng, when.toISOString(), notes, svc.price, commission, paymentMethod);
  dispatchBooking(Number(lastInsertRowid));
  res.status(201).json(getBooking(Number(lastInsertRowid)));
});

r.get('/', requireAuth('customer'), (req, res) => {
  res.json(db.prepare(`${VIEW} WHERE b.customer_id = ? ORDER BY b.id DESC`).all(req.user.id));
});

r.get('/:id', requireAuth('customer'), (req, res) => {
  const b = getBooking(Number(req.params.id));
  if (!b || b.customer_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  res.json(b);
});

r.post('/:id/cancel', requireAuth('customer'), async (req, res) => {
  const b = getBooking(Number(req.params.id));
  if (!b || b.customer_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  if (!['searching', 'assigned', 'unassigned'].includes(b.status))
    return res.status(409).json({ error: 'Booking can no longer be cancelled' });

  db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(b.id);
  db.prepare(`UPDATE offers SET status = 'expired' WHERE booking_id = ? AND status = 'pending'`).run(b.id);
  if (b.payment_status === 'paid') {
    const p = db.prepare(`SELECT * FROM payments WHERE booking_id = ? AND status = 'paid'`).get(b.id);
    try {
      if (p?.provider === 'razorpay') await refund(p.provider_payment_id, b.amount);
      db.prepare(`UPDATE bookings SET payment_status = 'refunded' WHERE id = ?`).run(b.id);
    } catch (e) {
      console.error('Refund failed for booking', b.id, e.message); // stays 'paid' so admin can retry
    }
  }
  res.json(getBooking(b.id));
});

r.post('/:id/rating', requireAuth('customer'), (req, res) => {
  const { rating, comment = '' } = req.body || {};
  const b = getBooking(Number(req.params.id));
  if (!b || b.customer_id !== req.user.id) return res.status(404).json({ error: 'Not found' });
  if (b.status !== 'completed') return res.status(409).json({ error: 'Only completed bookings can be rated' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ error: 'rating must be an integer 1-5' });
  if (b.rating) return res.status(409).json({ error: 'Already rated' });
  db.prepare('INSERT INTO ratings (booking_id, rating, comment) VALUES (?,?,?)').run(b.id, rating, comment);
  res.status(201).json(getBooking(b.id));
});

export default r;
