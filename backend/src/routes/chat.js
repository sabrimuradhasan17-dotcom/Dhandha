import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const r = Router();

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id, id);
`);

// Only the booking's customer and its assigned (or directly requested) worker may chat.
function participant(req, res, next) {
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(Number(req.params.id));
  const ok = b && [b.customer_id, b.worker_id, b.requested_worker_id].includes(req.user.id) && req.user.role !== 'admin';
  if (!ok) return res.status(404).json({ error: 'Not found' });
  req.booking = b;
  next();
}

r.get('/:id/messages', requireAuth('customer', 'worker'), participant, (req, res) => {
  const after = Number(req.query.after) || 0;
  res.json(
    db
      .prepare(
        `SELECT m.id, m.sender_id, u.name AS sender_name, m.body, m.created_at
         FROM messages m JOIN users u ON u.id = m.sender_id
         WHERE m.booking_id = ? AND m.id > ? ORDER BY m.id LIMIT 200`,
      )
      .all(req.booking.id, after),
  );
});

r.post('/:id/messages', requireAuth('customer', 'worker'), participant, (req, res) => {
  const body = String(req.body?.body ?? '').trim();
  if (!body || body.length > 1000) return res.status(400).json({ error: 'Message must be 1-1000 characters' });
  if (['cancelled', 'completed'].includes(req.booking.status))
    return res.status(409).json({ error: 'This booking is closed for chat' });
  const x = db.prepare('INSERT INTO messages (booking_id, sender_id, body) VALUES (?,?,?)').run(req.booking.id, req.user.id, body);
  res.status(201).json(db.prepare('SELECT id, sender_id, body, created_at FROM messages WHERE id = ?').get(Number(x.lastInsertRowid)));
});

export default r;
