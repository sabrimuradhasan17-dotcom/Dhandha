import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { manualAssign, dispatchBooking } from '../dispatch.js';
import { getBooking } from './bookings.js';

const r = Router();
r.use(requireAuth('admin'));

r.get('/stats', (_req, res) => {
  res.json(
    db
      .prepare(
        `SELECT COUNT(*) AS bookings,
                COALESCE(SUM(CASE WHEN status='completed' THEN amount END),0) AS gmv,
                COALESCE(SUM(CASE WHEN status='completed' THEN commission END),0) AS revenue,
                SUM(status='unassigned') AS unassigned,
                SUM(status IN ('searching','assigned','on_the_way','in_progress')) AS open
         FROM bookings`,
      )
      .get(),
  );
});

r.get('/bookings', (req, res) => {
  const { status } = req.query;
  const ids = status
    ? db.prepare('SELECT id FROM bookings WHERE status = ? ORDER BY id DESC LIMIT 200').all(status)
    : db.prepare('SELECT id FROM bookings ORDER BY id DESC LIMIT 200').all();
  res.json(ids.map((x) => getBooking(x.id)));
});

r.post('/bookings/:id/assign', (req, res) => {
  const w = db.prepare('SELECT 1 FROM workers WHERE user_id = ? AND approved = 1').get(Number(req.body?.workerId));
  if (!w) return res.status(400).json({ error: 'Unknown or unapproved worker' });
  if (!manualAssign(Number(req.params.id), Number(req.body.workerId)))
    return res.status(409).json({ error: 'Booking cannot be assigned in its current state' });
  res.json(getBooking(Number(req.params.id)));
});

r.post('/bookings/:id/redispatch', (req, res) => {
  const id = Number(req.params.id);
  const upd = db.prepare(`UPDATE bookings SET status = 'searching' WHERE id = ? AND status = 'unassigned'`).run(id);
  if (!upd.changes) return res.status(409).json({ error: 'Only unassigned bookings can be re-dispatched' });
  db.prepare(`DELETE FROM offers WHERE booking_id = ? AND status != 'accepted'`).run(id);
  dispatchBooking(id);
  res.json(getBooking(id));
});

r.get('/workers', (_req, res) => {
  res.json(
    db
      .prepare(
        `SELECT u.id, u.name, u.phone, c.name AS category, w.approved, w.available,
                (SELECT ROUND(AVG(rt.rating),2) FROM ratings rt JOIN bookings b ON b.id = rt.booking_id
                 WHERE b.worker_id = u.id) AS avg_rating,
                (SELECT COUNT(*) FROM bookings b WHERE b.worker_id = u.id AND b.status = 'completed') AS jobs
         FROM workers w JOIN users u ON u.id = w.user_id JOIN categories c ON c.id = w.category_id
         ORDER BY w.approved, u.id DESC`,
      )
      .all(),
  );
});

r.put('/workers/:id/approval', (req, res) => {
  const ok = req.body?.approved ? 1 : 0;
  const r2 = db
    .prepare(`UPDATE workers SET approved = ?, available = CASE WHEN ? = 0 THEN 0 ELSE available END WHERE user_id = ?`)
    .run(ok, ok, Number(req.params.id));
  if (!r2.changes) return res.status(404).json({ error: 'Worker not found' });
  res.json({ ok: true });
});

r.post('/categories', (req, res) => {
  if (!req.body?.name) return res.status(400).json({ error: 'name required' });
  try {
    const x = db.prepare('INSERT INTO categories (name, icon) VALUES (?,?)').run(req.body.name, req.body.icon || '');
    res.status(201).json({ id: Number(x.lastInsertRowid), name: req.body.name });
  } catch {
    res.status(409).json({ error: 'Category exists' });
  }
});

r.post('/services', (req, res) => {
  const { categoryId, name, description = '', price, durationMin = 60 } = req.body || {};
  if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId) || !name || !(price > 0))
    return res.status(400).json({ error: 'categoryId, name and positive price required' });
  const x = db
    .prepare('INSERT INTO services (category_id, name, description, price, duration_min) VALUES (?,?,?,?,?)')
    .run(categoryId, name, description, Math.round(price), durationMin);
  res.status(201).json(db.prepare('SELECT * FROM services WHERE id = ?').get(Number(x.lastInsertRowid)));
});

r.put('/services/:id', (req, res) => {
  const s = db.prepare('SELECT * FROM services WHERE id = ?').get(Number(req.params.id));
  if (!s) return res.status(404).json({ error: 'Not found' });
  const n = { ...s, ...req.body };
  db.prepare('UPDATE services SET name=?, description=?, price=?, duration_min=?, active=? WHERE id=?').run(
    n.name,
    n.description,
    Math.round(n.price),
    n.duration_min,
    n.active ? 1 : 0,
    s.id,
  );
  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(s.id));
});

export default r;
