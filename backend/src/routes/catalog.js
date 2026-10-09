import { Router } from 'express';
import { db } from '../db.js';

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

export default r;
