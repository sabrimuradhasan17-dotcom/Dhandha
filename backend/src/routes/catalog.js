import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const r = Router();

r.get('/categories', (_req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY name').all());
});

r.get('/services', (req, res) => {
  const { categoryId } = req.query;
  const rows = categoryId
    ? db.prepare('SELECT * FROM services WHERE active = 1 AND category_id = ?').all(Number(categoryId))
    : db.prepare('SELECT * FROM services WHERE active = 1').all();
  res.json(rows);
});

// Browse professionals (with contact details) so customers can choose one.
r.get('/workers', requireAuth('customer'), (req, res) => {
  const { categoryId } = req.query;
  res.json(
    db
      .prepare(
        `SELECT u.id, u.name, u.phone, w.category_id, c.name AS category, w.bio, w.experience_years, w.available,
                (SELECT ROUND(AVG(rt.rating),1) FROM ratings rt JOIN bookings b ON b.id = rt.booking_id WHERE b.worker_id = u.id) AS avg_rating,
                (SELECT COUNT(*) FROM ratings rt JOIN bookings b ON b.id = rt.booking_id WHERE b.worker_id = u.id) AS rating_count,
                (SELECT COUNT(*) FROM bookings b WHERE b.worker_id = u.id AND b.status = 'completed') AS jobs
         FROM workers w JOIN users u ON u.id = w.user_id JOIN categories c ON c.id = w.category_id
         WHERE w.approved = 1 AND (? IS NULL OR w.category_id = ?)
         ORDER BY avg_rating DESC, jobs DESC`,
      )
      .all(categoryId ? Number(categoryId) : null, categoryId ? Number(categoryId) : null),
  );
});

export default r;
