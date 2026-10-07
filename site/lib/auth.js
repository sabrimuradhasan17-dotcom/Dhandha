import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { get } from './db.js';

const COOKIE = 'bz_session';
const MAX_AGE = 60 * 60 * 12; // 12 hours
const secret = () => get("SELECT value FROM settings WHERE key='session_secret'").value;
const sign = (p) => crypto.createHmac('sha256', secret()).update(p).digest('base64url');

export function createSession(userId) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  cookies().set(COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1', path: '/', maxAge: MAX_AGE });
}
export const destroySession = () => cookies().delete(COOKIE);

export function getUser() {
  const c = cookies().get(COOKIE)?.value;
  if (!c) return null;
  const [payload, sig] = c.split('.');
  if (!payload || !sig) return null;
  const good = sign(payload);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (exp < Date.now()) return null;
    return get('SELECT id,email,name,role FROM users WHERE id=?', uid) || null;
  } catch { return null; }
}
export function requireUser(role) {
  const u = getUser();
  if (!u) redirect('/admin/login');
  if (role && u.role !== role) redirect('/admin?error=' + encodeURIComponent('Owner access required'));
  return u;
}
