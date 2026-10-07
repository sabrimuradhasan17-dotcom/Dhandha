'use server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { get, all, run, tx, DATA_DIR } from '@/lib/db.js';
import { createSession, destroySession, requireUser } from '@/lib/auth.js';
import { hashPassword, verifyPassword } from '@/lib/password.js';
import { slugify } from '@/lib/util.js';

const s = (fd, k, n = 2000) => String(fd.get(k) ?? '').trim().slice(0, n);
const num = (fd, k) => { const v = s(fd, k, 12); return v === '' ? null : Number(v.replace(/,/g, '')); };
const fail = (to, msg) => redirect(`${to}${to.includes('?') ? '&' : '?'}error=${encodeURIComponent(msg)}`);
const ok = (to, msg) => { revalidatePath('/', 'layout'); redirect(`${to}${to.includes('?') ? '&' : '?'}ok=${encodeURIComponent(msg)}`); };
const audit = (u, action, detail) => run('INSERT INTO audit_log(user_email,action,detail) VALUES(?,?,?)', u.email, action, detail);
const uniqueSlug = (table, base, id) => { let slug = base || 'item', i = 2; while (get(`SELECT id FROM ${table} WHERE slug=? AND id<>?`, slug, id ?? -1)) slug = `${base}-${i++}`; return slug; };

/* ---- auth ---- */
const attempts = globalThis.__loginAttempts || (globalThis.__loginAttempts = new Map());
export async function login(fd) {
  const email = s(fd, 'email', 120).toLowerCase(), pw = String(fd.get('password') || '');
  const key = `${(headers().get('x-forwarded-for') || 'local').split(',')[0]}|${email}`, now = Date.now();
  const recent = (attempts.get(key) || []).filter((t) => now - t < 15 * 60e3);
  if (recent.length >= 5) fail('/admin/login', 'Too many attempts. Try again in 15 minutes.');
  const u = get('SELECT * FROM users WHERE email=?', email);
  if (!u || !verifyPassword(pw, u.password_hash)) { attempts.set(key, [...recent, now]); fail('/admin/login', 'Wrong email or password.'); }
  attempts.delete(key); createSession(u.id); audit(u, 'login', ''); redirect('/admin');
}
export async function logout() { destroySession(); redirect('/admin/login'); }
export async function changePassword(fd) {
  const u = requireUser(), row = get('SELECT * FROM users WHERE id=?', u.id), np = String(fd.get('new') || '');
  if (!verifyPassword(String(fd.get('current') || ''), row.password_hash)) fail('/admin/account', 'Current password is wrong.');
  if (np.length < 8) fail('/admin/account', 'New password must be at least 8 characters.');
  run('UPDATE users SET password_hash=? WHERE id=?', hashPassword(np), u.id); audit(u, 'password changed', ''); ok('/admin/account', 'Password updated.');
}

/* ---- tours ---- */
function parseDates(text) {
  const out = [];
  for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const [d, seats, price] = line.split('|').map((x) => x.trim());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(Date.parse(d))) throw new Error(`Bad date "${d}". Use YYYY-MM-DD | seats | price`);
    out.push([d, seats ? parseInt(seats) : null, price ? parseInt(price.replace(/[^\d]/g, '')) : null]);
  }
  return out;
}
async function saveImage(file) {
  if (!file || typeof file === 'string' || !file.size) return null;
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[file.type];
  if (!ext) throw new Error('Image must be JPG, PNG, WebP or AVIF.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5 MB.');
  const name = `${crypto.randomBytes(10).toString('hex')}.${ext}`;
  fs.mkdirSync(path.join(DATA_DIR, 'uploads'), { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, 'uploads', name), Buffer.from(await file.arrayBuffer()));
  return name;
}
export async function saveTour(fd) {
  const u = requireUser(), id = fd.get('id') ? Number(fd.get('id')) : null, back = id ? `/admin/tours/${id}` : '/admin/tours/new';
  const name = s(fd, 'name', 140), price = num(fd, 'price');
  if (!name) fail(back, 'Tour name is required.');
  if (price == null || !(price > 0)) fail(back, 'Price must be a number above 0.');
  const itinerary = s(fd, 'itinerary', 20000).split('\n').map((l) => l.trim()).filter(Boolean);
  if (!itinerary.length) fail(back, 'Add at least one itinerary day (one per line).');
  let dates; try { dates = parseDates(s(fd, 'dates', 5000)); } catch (e) { fail(back, e.message); }
  let image = null; try { image = await saveImage(fd.get('image')); } catch (e) { fail(back, e.message); }
  const list = (k, sep) => s(fd, k, 5000).split(sep).map((x) => x.trim()).filter(Boolean);
  const status = s(fd, 'status') === 'live' ? 'live' : 'draft';
  const slug = uniqueSlug('tours', slugify(s(fd, 'slug', 80) || name), id);
  const vals = [slug, name, price, s(fd, 'route', 200), s(fd, 'photo', 100) || name, JSON.stringify(list('highlights', ',')), JSON.stringify(list('inclusions', '\n')), JSON.stringify(itinerary), status, s(fd, 'seo_title', 120), s(fd, 'seo_desc', 300)];
  const newId = tx(() => {
    let tid = id;
    if (id) {
      const old = get('SELECT price FROM tours WHERE id=?', id);
      run('UPDATE tours SET slug=?,name=?,price=?,route=?,photo=?,highlights=?,inclusions=?,itinerary=?,status=?,seo_title=?,seo_desc=? WHERE id=?', ...vals, id);
      if (old && old.price !== price) audit(u, 'price changed', `${name}: ${old.price} -> ${price}`);
      if (fd.get('remove_image') === '1') run('UPDATE tours SET image=NULL WHERE id=?', id);
    } else {
      tid = run('INSERT INTO tours(slug,name,price,route,photo,highlights,inclusions,itinerary,status,seo_title,seo_desc,hue) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', ...vals, Math.floor(Math.random() * 360)).lastInsertRowid;
    }
    if (image) run('UPDATE tours SET image=? WHERE id=?', image, tid);
    run('DELETE FROM tour_dates WHERE tour_id=?', tid);
    for (const [d, seats, p] of dates) run('INSERT INTO tour_dates(tour_id,date,seats,price) VALUES(?,?,?,?)', tid, d, seats, p);
    return tid;
  });
  audit(u, id ? 'tour updated' : 'tour created', name);
  ok(`/admin/tours/${newId}`, 'Tour saved. It is live on the website now.');
}
export async function deleteTour(fd) { const u = requireUser('owner'), id = Number(fd.get('id')), t = get('SELECT name FROM tours WHERE id=?', id); run('DELETE FROM tours WHERE id=?', id); audit(u, 'tour deleted', t?.name || id); ok('/admin/tours', 'Tour deleted.'); }
export async function setTourStatus(fd) { const u = requireUser(); const id = Number(fd.get('id')), st = fd.get('status') === 'live' ? 'live' : 'draft'; run('UPDATE tours SET status=? WHERE id=?', st, id); audit(u, 'tour status', `${id} -> ${st}`); ok('/admin/tours', 'Status updated.'); }

/* ---- flights ---- */
export async function saveFlight(fd) {
  const u = requireUser(), id = fd.get('id') ? Number(fd.get('id')) : null, route = s(fd, 'route', 120);
  if (!route) fail('/admin/flights', 'Route is required.');
  const v = [route, s(fd, 'airline', 60), s(fd, 'flight_no', 20), s(fd, 'dep', 5), s(fd, 'arr', 5), num(fd, 'price') || 0, s(fd, 'days', 60), num(fd, 'seats') || 0, fd.get('active') ? 1 : 0];
  if (id) run('UPDATE flights SET route=?,airline=?,flight_no=?,dep=?,arr=?,price=?,days=?,seats=?,active=? WHERE id=?', ...v, id);
  else run('INSERT INTO flights(route,airline,flight_no,dep,arr,price,days,seats,active) VALUES(?,?,?,?,?,?,?,?,?)', ...v);
  audit(u, id ? 'flight updated' : 'flight added', `${route} ${v[2]} fare ${v[5]}`); ok('/admin/flights', 'Flight saved.');
}
export async function deleteFlight(fd) { const u = requireUser('owner'); run('DELETE FROM flights WHERE id=?', Number(fd.get('id'))); audit(u, 'flight deleted', fd.get('id')); ok('/admin/flights', 'Flight deleted.'); }

/* ---- enquiries ---- */
export async function setEnquiryStatus(fd) {
  requireUser(); const st = s(fd, 'status', 12);
  if (!['new', 'contacted', 'booked', 'lost'].includes(st)) fail('/admin/enquiries', 'Invalid status.');
  run('UPDATE enquiries SET status=? WHERE id=?', st, Number(fd.get('id'))); ok('/admin/enquiries', 'Enquiry updated.');
}
export async function deleteEnquiry(fd) { requireUser('owner'); run('DELETE FROM enquiries WHERE id=?', Number(fd.get('id'))); ok('/admin/enquiries', 'Enquiry deleted.'); }

/* ---- posts / reviews ---- */
export async function savePost(fd) {
  const u = requireUser(), id = fd.get('id') ? Number(fd.get('id')) : null, title = s(fd, 'title', 160);
  if (!title) fail('/admin/posts', 'Title is required.');
  const slug = uniqueSlug('posts', slugify(s(fd, 'slug', 80) || title), id), v = [slug, title, s(fd, 'excerpt', 300), s(fd, 'body', 40000), s(fd, 'status') === 'live' ? 'live' : 'draft'];
  if (id) run('UPDATE posts SET slug=?,title=?,excerpt=?,body=?,status=? WHERE id=?', ...v, id); else run('INSERT INTO posts(slug,title,excerpt,body,status) VALUES(?,?,?,?,?)', ...v);
  audit(u, 'post saved', title); ok('/admin/posts', 'Post saved.');
}
export async function deletePost(fd) { requireUser('owner'); run('DELETE FROM posts WHERE id=?', Number(fd.get('id'))); ok('/admin/posts', 'Post deleted.'); }
export async function saveReview(fd) {
  requireUser(); const id = fd.get('id') ? Number(fd.get('id')) : null, name = s(fd, 'name', 80);
  if (!name) fail('/admin/reviews', 'Name is required.');
  const v = [name, s(fd, 'trip', 100), Math.min(5, Math.max(1, num(fd, 'rating') || 5)), s(fd, 'text', 800), s(fd, 'status') === 'draft' ? 'draft' : 'live'];
  if (id) run('UPDATE reviews SET name=?,trip=?,rating=?,text=?,status=? WHERE id=?', ...v, id); else run('INSERT INTO reviews(name,trip,rating,text,status) VALUES(?,?,?,?,?)', ...v);
  ok('/admin/reviews', 'Review saved.');
}
export async function deleteReview(fd) { requireUser('owner'); run('DELETE FROM reviews WHERE id=?', Number(fd.get('id'))); ok('/admin/reviews', 'Review deleted.'); }

/* ---- seo / settings / users ---- */
export async function saveSeo(fd) {
  const u = requireUser();
  for (const r of all('SELECT key FROM seo_pages')) run('UPDATE seo_pages SET title=?,description=? WHERE key=?', s(fd, `t_${r.key}`, 160), s(fd, `d_${r.key}`, 400), r.key);
  audit(u, 'seo updated', ''); ok('/admin/seo', 'SEO saved.');
}
export async function saveSettings(fd) {
  const u = requireUser('owner');
  const wa = s(fd, 'wa', 20).replace(/\D/g, '');
  if (wa.length < 10) fail('/admin/settings', 'WhatsApp number must include country code, e.g. 919876543210.');
  for (const k of ['phone', 'email', 'address']) run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, s(fd, k, 200));
  run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', 'wa', wa);
  audit(u, 'settings updated', ''); ok('/admin/settings', 'Settings saved.');
}
export async function createUser(fd) {
  const u = requireUser('owner'), email = s(fd, 'email', 120).toLowerCase(), pw = String(fd.get('password') || '');
  if (!/^\S+@\S+\.\S+$/.test(email)) fail('/admin/users', 'Enter a valid email.');
  if (pw.length < 8) fail('/admin/users', 'Password must be at least 8 characters.');
  if (get('SELECT id FROM users WHERE email=?', email)) fail('/admin/users', 'That email already has an account.');
  run('INSERT INTO users(email,name,role,password_hash) VALUES(?,?,?,?)', email, s(fd, 'name', 80) || email, fd.get('role') === 'owner' ? 'owner' : 'staff', hashPassword(pw));
  audit(u, 'user created', email); ok('/admin/users', 'User created.');
}
export async function deleteUser(fd) {
  const u = requireUser('owner'), id = Number(fd.get('id'));
  if (id === u.id) fail('/admin/users', 'You cannot delete your own account.');
  const target = get('SELECT role FROM users WHERE id=?', id);
  if (target?.role === 'owner' && get("SELECT COUNT(*) c FROM users WHERE role='owner'").c <= 1) fail('/admin/users', 'Keep at least one owner.');
  run('DELETE FROM users WHERE id=?', id); audit(u, 'user deleted', id); ok('/admin/users', 'User deleted.');
}
export async function resetUserPassword(fd) {
  const u = requireUser('owner'), pw = String(fd.get('password') || '');
  if (pw.length < 8) fail('/admin/users', 'Password must be at least 8 characters.');
  run('UPDATE users SET password_hash=? WHERE id=?', hashPassword(pw), Number(fd.get('id'))); audit(u, 'password reset', fd.get('id')); ok('/admin/users', 'Password reset.');
}
