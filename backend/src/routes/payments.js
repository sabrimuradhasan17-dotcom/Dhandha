import { Router } from 'express';
import { db, tx } from '../db.js';
import { requireAuth } from '../auth.js';
import { razorpayEnabled } from '../config.js';
import { createOrder, verifySignature, verifyWebhook, mockSign } from '../payments.js';

const r = Router();

const markPaid = (orderId, paymentId) =>
  tx(() => {
    const p = db.prepare(`SELECT * FROM payments WHERE provider_order_id = ?`).get(orderId);
    if (!p) return false;
    if (p.status !== 'paid') {
      db.prepare(`UPDATE payments SET status = 'paid', provider_payment_id = ? WHERE id = ?`).run(paymentId, p.id);
      db.prepare(`UPDATE bookings SET payment_status = 'paid' WHERE id = ?`).run(p.booking_id);
    }
    return true;
  });

// Step 1: app asks for an order for a booking it owns.
r.post('/order', requireAuth('customer'), async (req, res) => {
  const b = db.prepare('SELECT * FROM bookings WHERE id = ? AND customer_id = ?').get(
    Number(req.body?.bookingId),
    req.user.id,
  );
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  if (b.payment_method !== 'online') return res.status(409).json({ error: 'Booking is pay-by-cash' });
  if (b.payment_status !== 'pending' || b.status === 'cancelled')
    return res.status(409).json({ error: 'Booking is not payable' });
  try {
    const o = await createOrder(b.id, b.amount);
    db.prepare(
      `INSERT INTO payments (booking_id, provider, provider_order_id, amount) VALUES (?,?,?,?)`,
    ).run(b.id, o.provider, o.orderId, b.amount);
    res.json({ ...o, amount: b.amount, currency: 'INR', bookingId: b.id });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Step 2: app returns Razorpay's {orderId, paymentId, signature} after checkout.
r.post('/verify', requireAuth('customer'), (req, res) => {
  const { orderId, paymentId, signature } = req.body || {};
  const p = db
    .prepare(
      `SELECT p.* FROM payments p JOIN bookings b ON b.id = p.booking_id
       WHERE p.provider_order_id = ? AND b.customer_id = ?`,
    )
    .get(orderId || '', req.user.id);
  if (!p) return res.status(404).json({ error: 'Order not found' });
  if (!verifySignature(orderId, paymentId || '', signature || ''))
    return res.status(400).json({ error: 'Invalid payment signature' });
  markPaid(orderId, paymentId);
  res.json({ ok: true, bookingId: p.booking_id });
});

// Dev only: simulates the checkout UI so the whole flow works without Razorpay keys.
r.post('/mock-pay', requireAuth('customer'), (req, res) => {
  if (razorpayEnabled() || process.env.NODE_ENV === 'production')
    return res.status(404).json({ error: 'Not available' });
  const orderId = req.body?.orderId || '';
  const paymentId = `mock_pay_${Date.now()}`;
  res.json({ orderId, paymentId, signature: mockSign(orderId, paymentId) });
});

// Razorpay server-to-server webhook (source of truth if the app dies mid-payment).
r.post('/webhook', (req, res) => {
  if (!verifyWebhook(req.rawBody || '', req.headers['x-razorpay-signature']))
    return res.status(400).json({ error: 'Bad signature' });
  const pay = req.body?.payload?.payment?.entity;
  if (req.body?.event === 'payment.captured' && pay) markPaid(pay.order_id, pay.id);
  res.json({ ok: true });
});

export default r;
