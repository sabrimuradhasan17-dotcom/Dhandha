import { db, tx } from './db.js';
import { config } from './config.js';

export function haversineKm(lat1, lng1, lat2, lng2) {
  const r = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Offer a booking to the nearest available workers of the right category who
 * have not been offered it yet. Marks the booking `unassigned` when nobody is left.
 */
export function dispatchBooking(bookingId) {
  return tx(() => {
    const b = db
      .prepare(
        `SELECT b.*, s.category_id FROM bookings b JOIN services s ON s.id = b.service_id WHERE b.id = ?`,
      )
      .get(bookingId);
    if (!b || b.status !== 'searching') return [];

    const candidates = db
      .prepare(
        `SELECT w.user_id, w.lat, w.lng FROM workers w
         WHERE w.category_id = ? AND w.approved = 1 AND w.available = 1
           AND w.lat IS NOT NULL AND w.lng IS NOT NULL
           AND w.user_id NOT IN (SELECT worker_id FROM offers WHERE booking_id = ?)
           AND w.user_id NOT IN (SELECT worker_id FROM bookings
                                 WHERE worker_id IS NOT NULL AND status IN ('assigned','on_the_way','in_progress')
                                   AND scheduled_at = ?)`,
      )
      .all(b.category_id, b.id, b.scheduled_at)
      .map((w) => ({ ...w, km: haversineKm(b.lat, b.lng, w.lat, w.lng) }))
      .sort((x, y) => x.km - y.km)
      .slice(0, config.offerFanout);

    if (candidates.length === 0) {
      const pending = db
        .prepare(`SELECT COUNT(*) c FROM offers WHERE booking_id = ? AND status = 'pending'`)
        .get(b.id).c;
      if (pending === 0) db.prepare(`UPDATE bookings SET status = 'unassigned' WHERE id = ?`).run(b.id);
      return [];
    }
    const ins = db.prepare('INSERT INTO offers (booking_id, worker_id) VALUES (?,?)');
    for (const c of candidates) ins.run(b.id, c.user_id);
    return candidates.map((c) => c.user_id);
  });
}

export function acceptOffer(bookingId, workerId) {
  return tx(() => {
    const offer = db
      .prepare(`SELECT 1 FROM offers WHERE booking_id = ? AND worker_id = ? AND status = 'pending'`)
      .get(bookingId, workerId);
    const res = offer
      ? db
          .prepare(
            `UPDATE bookings SET worker_id = ?, status = 'assigned' WHERE id = ? AND status = 'searching'`,
          )
          .run(workerId, bookingId)
      : { changes: 0 };
    if (!res.changes) return false; // someone else got it first
    db.prepare(`UPDATE offers SET status = 'accepted' WHERE booking_id = ? AND worker_id = ?`).run(
      bookingId,
      workerId,
    );
    db.prepare(`UPDATE offers SET status = 'expired' WHERE booking_id = ? AND status = 'pending'`).run(
      bookingId,
    );
    return true;
  });
}

export function declineOffer(bookingId, workerId) {
  const r = db
    .prepare(`UPDATE offers SET status = 'declined' WHERE booking_id = ? AND worker_id = ? AND status = 'pending'`)
    .run(bookingId, workerId);
  if (!r.changes) return false;
  const pending = db
    .prepare(`SELECT COUNT(*) c FROM offers WHERE booking_id = ? AND status = 'pending'`)
    .get(bookingId).c;
  if (pending === 0) dispatchBooking(bookingId); // widen to the next nearest workers
  return true;
}

export function manualAssign(bookingId, workerId) {
  return tx(() => {
    const res = db
      .prepare(
        `UPDATE bookings SET worker_id = ?, status = 'assigned' WHERE id = ? AND status IN ('searching','unassigned')`,
      )
      .run(workerId, bookingId);
    if (res.changes) {
      db.prepare(`UPDATE offers SET status = 'expired' WHERE booking_id = ? AND status = 'pending'`).run(bookingId);
    }
    return res.changes > 0;
  });
}
