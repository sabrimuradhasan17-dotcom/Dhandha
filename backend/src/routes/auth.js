import { Router } from 'express';
import { db } from '../db.js';
import { hashPassword, verifyPassword, signToken, requireAuth } from '../auth.js';

const r = Router();
const PHONE = /^\d{10}$/;

r.post('/register', (req, res) => {
  const { name, phone, password, role = 'customer', categoryId } = req.body || {};
  if (!name || !PHONE.test(phone || '') || (password || '').length < 6)
    return res.status(400).json({ error: 'name, 10-digit phone and password (min 6 chars) are required' });
  if (!['customer', 'worker'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (role === 'worker' && !db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId))
    return res.status(400).json({ error: 'Workers must pick a valid categoryId' });
  if (db.prepare('SELECT 1 FROM users WHERE phone = ?').get(phone))
    return res.status(409).json({ error: 'Phone already registered' });

  const { lastInsertRowid: id } = db
    .prepare('INSERT INTO users (name, phone, password_hash, role) VALUES (?,?,?,?)')
    .run(name, phone, hashPassword(password), role);
  if (role === 'worker') db.prepare('INSERT INTO workers (user_id, category_id) VALUES (?,?)').run(id, categoryId);
  const user = { id: Number(id), name, phone, role };
  res.status(201).json({ token: signToken(user), user, pendingApproval: role === 'worker' });
});

r.post('/login', (req, res) => {
  const { phone, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone || '');
  if (!u || !verifyPassword(password || '', u.password_hash))
    return res.status(401).json({ error: 'Invalid phone or password' });
  res.json({ token: signToken(u), user: { id: u.id, name: u.name, phone: u.phone, role: u.role } });
});

r.get('/me', requireAuth(), (req, res) => {
  const u = db.prepare('SELECT id, name, phone, role FROM users WHERE id = ?').get(req.user.id);
  const w = u.role === 'worker' ? db.prepare('SELECT * FROM workers WHERE user_id = ?').get(u.id) : null;
  res.json({ ...u, worker: w });
});

export default r;
