import { db } from './db.js';
import { hashPassword } from './auth.js';

const CATALOG = {
  'Home Cleaning': [
    ['Full Home Deep Clean', 'Kitchen, bathrooms, floors and rooms', 2499, 240],
    ['Bathroom Cleaning', 'Deep clean of one bathroom', 499, 60],
  ],
  Plumbing: [
    ['Tap / Leak Repair', 'Fix leaking taps and pipes', 299, 45],
    ['Water Tank Cleaning', 'Overhead tank cleaning', 899, 90],
  ],
  Electrician: [
    ['Fan / Light Installation', 'Install or replace fan or light', 249, 30],
    ['Switchboard Repair', 'Repair or replace switches', 349, 45],
  ],
  'AC Service': [
    ['AC Service (Split)', 'Jet-pump cleaning and checkup', 599, 60],
    ['AC Installation', 'Split AC installation', 1499, 120],
  ],
  'Salon at Home': [
    ['Haircut', 'Professional haircut at home', 399, 45],
    ['Facial', 'Cleanup and facial', 899, 60],
  ],
};

export function seedCatalog() {
  if (db.prepare('SELECT COUNT(*) c FROM categories').get().c > 0) return;
  const addCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const addSvc = db.prepare(
    'INSERT INTO services (category_id, name, description, price, duration_min) VALUES (?,?,?,?,?)',
  );
  for (const [cat, svcs] of Object.entries(CATALOG)) {
    const { lastInsertRowid } = addCat.run(cat);
    for (const [n, d, p, m] of svcs) addSvc.run(lastInsertRowid, n, d, p, m);
  }
}

export function seedAdmin() {
  const phone = process.env.ADMIN_PHONE || '9999999999';
  const pw = process.env.ADMIN_PASSWORD || 'admin123';
  if (db.prepare('SELECT 1 FROM users WHERE role = ?').get('admin')) return;
  db.prepare('INSERT INTO users (name, phone, password_hash, role) VALUES (?,?,?,?)').run(
    'Admin',
    phone,
    hashPassword(pw),
    'admin',
  );
  if (!process.env.ADMIN_PASSWORD) console.warn(`Seeded admin ${phone} / admin123 — set ADMIN_PASSWORD in production`);
}
