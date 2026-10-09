import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { config } from '../config.js';
import { sendSms, smsEnabled } from '../sms.js';
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

/* ---- Phone OTP login / signup (customers & workers; admins use password) ---- */
const otpHash = (phone, code) => crypto.createHmac('sha256', config.jwtSecret).update(`${phone}:${code}`).digest('hex');

r.post('/otp/request', async (req, res) => {
  const { phone } = req.body || {};
  if (!PHONE.test(phone || '')) return res.status(400).json({ error: 'Enter a valid 10-digit phone number' });
  const u = db.prepare('SELECT role FROM users WHERE phone = ?').get(phone);
  if (u?.role === 'admin') return res.status(403).json({ error: 'Admins must sign in with a password' });
  const prev = db.prepare('SELECT created_at FROM otp_codes WHERE phone = ?').get(phone);
  if (prev && Date.now() - prev.created_at < config.otpCooldownSec * 1000)
    return res.status(429).json({ error: `Please wait ${config.otpCooldownSec}s before requesting another code` });
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  db.prepare(
    `INSERT INTO otp_codes (phone, code_hash, expires_at, attempts, created_at) VALUES (?,?,?,0,?)
     ON CONFLICT(phone) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, created_at = excluded.created_at`,
  ).run(phone, otpHash(phone, code), Date.now() + 5 * 60_000, Date.now());
  try {
    await sendSms(phone, `Your Dhandha verification code is ${code}. It expires in 5 minutes.`);
  } catch (e) {
    console.error('OTP SMS failed', e.message);
    return res.status(502).json({ error: 'Could not send the code. Try again.' });
  }
  const dev = !smsEnabled() && process.env.NODE_ENV !== 'production';
  res.json({ ok: true, isNewUser: !u, ...(dev && { devOtp: code }) });
});

r.post('/otp/verify', (req, res) => {
  const { phone, otp, name, role = 'customer', categoryId } = req.body || {};
  const row = db.prepare('SELECT * FROM otp_codes WHERE phone = ?').get(phone || '');
  if (!row || row.expires_at < Date.now() || row.attempts >= 5)
    return res.status(400).json({ error: 'Code expired. Request a new one.' });
  db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ?').run(phone);
  const given = Buffer.from(otpHash(phone, String(otp ?? '')), 'hex');
  if (!crypto.timingSafeEqual(given, Buffer.from(row.code_hash, 'hex')))
    return res.status(400).json({ error: 'Incorrect code' });

  let u = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (u?.role === 'admin') return res.status(403).json({ error: 'Admins must sign in with a password' });
  if (!u) {
    // New user: needs profile details. Don't burn the code until we have them.
    if (!name) return res.json({ needsProfile: true });
    if (!['customer', 'worker'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (role === 'worker' && !db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId))
      return res.status(400).json({ error: 'Workers must pick a valid categoryId' });
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (name, phone, password_hash, role) VALUES (?,?,?,?)')
      .run(name, phone, hashPassword(crypto.randomBytes(24).toString('hex')), role);
    if (role === 'worker') db.prepare('INSERT INTO workers (user_id, category_id) VALUES (?,?)').run(lastInsertRowid, categoryId);
    u = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
    db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);
    return res.status(201).json({ token: signToken(u), user: { id: u.id, name: u.name, phone: u.phone, role: u.role }, pendingApproval: role === 'worker' });
  }
  db.prepare('DELETE FROM otp_codes WHERE phone = ?').run(phone);
  res.json({ token: signToken(u), user: { id: u.id, name: u.name, phone: u.phone, role: u.role } });
});

r.put('/push-token', requireAuth(), (req, res) => {
  const token = String(req.body?.token || '');
  if (!/^(Expo|Exponent)PushToken\[.+\]$/.test(token)) return res.status(400).json({ error: 'Invalid push token' });
  db.prepare(
    `INSERT INTO push_tokens (token, user_id) VALUES (?, ?) ON CONFLICT(token) DO UPDATE SET user_id = excluded.user_id`,
  ).run(token, req.user.id);
  res.json({ ok: true });
});

r.get('/me', requireAuth(), (req, res) => {
  const u = db.prepare('SELECT id, name, phone, role FROM users WHERE id = ?').get(req.user.id);
  const w = u.role === 'worker' ? db.prepare('SELECT * FROM workers WHERE user_id = ?').get(u.id) : null;
  res.json({ ...u, worker: w });
});

export default r;
