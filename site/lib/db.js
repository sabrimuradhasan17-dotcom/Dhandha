import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SEED } from './seed-data.js';
import { hashPassword } from './password.js';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN('owner','staff')), password_hash TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS tours(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, price INTEGER NOT NULL, route TEXT, photo TEXT, hue INTEGER DEFAULT 30, image TEXT, highlights TEXT DEFAULT '[]', inclusions TEXT DEFAULT '[]', itinerary TEXT DEFAULT '[]', status TEXT DEFAULT 'draft', seo_title TEXT, seo_desc TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tour_dates(id INTEGER PRIMARY KEY, tour_id INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE, date TEXT NOT NULL, seats INTEGER, price INTEGER);
CREATE TABLE IF NOT EXISTS flights(id INTEGER PRIMARY KEY, route TEXT NOT NULL, airline TEXT, flight_no TEXT, dep TEXT, arr TEXT, price INTEGER DEFAULT 0, days TEXT, seats INTEGER DEFAULT 0, active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS enquiries(id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT, tour TEXT, when_text TEXT, pax INTEGER, message TEXT, status TEXT DEFAULT 'new', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, excerpt TEXT, body TEXT, status TEXT DEFAULT 'draft', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY, name TEXT NOT NULL, trip TEXT, rating INTEGER DEFAULT 5, text TEXT, status TEXT DEFAULT 'live');
CREATE TABLE IF NOT EXISTS seo_pages(key TEXT PRIMARY KEY, title TEXT, description TEXT);
CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY, user_email TEXT, action TEXT, detail TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`;

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(path.join(DATA_DIR, 'bhutanz.db'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  db.exec(SCHEMA);
  seed(db);
  return db;
}

function seed(db) {
  const n = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
  const ins = (sql, ...a) => db.prepare(sql).run(...a);
  if (!n('users')) {
    const email = (process.env.ADMIN_EMAIL || 'owner@example.com').toLowerCase();
    const pw = process.env.ADMIN_PASSWORD || 'admin12345';
    ins('INSERT INTO users(email,name,role,password_hash) VALUES(?,?,?,?)', email, 'Owner', 'owner', hashPassword(pw));
  }
  if (!n('settings')) {
    for (const [k, v] of Object.entries(SEED.settings)) ins('INSERT INTO settings(key,value) VALUES(?,?)', k, v);
    ins('INSERT INTO settings(key,value) VALUES(?,?)', 'session_secret', crypto.randomBytes(32).toString('hex'));
  }
  if (!n('seo_pages')) for (const [k, v] of Object.entries(SEED.seo)) ins('INSERT INTO seo_pages(key,title,description) VALUES(?,?,?)', k, v.t, v.d);
  if (!n('tours')) {
    for (const t of SEED.tours) {
      const r = ins('INSERT INTO tours(slug,name,price,route,photo,hue,highlights,inclusions,itinerary,status,seo_title,seo_desc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
        t.slug, t.name, t.price, t.route, t.photo, t.hue, JSON.stringify(t.highlights), JSON.stringify(t.inclusions), JSON.stringify(t.itinerary), t.status, t.seoTitle, t.seoDesc);
      for (const d of t.dates) ins('INSERT INTO tour_dates(tour_id,date,seats,price) VALUES(?,?,?,NULL)', r.lastInsertRowid, d, 12);
    }
  }
  if (!n('flights')) for (const f of SEED.flights) ins('INSERT INTO flights(route,airline,flight_no,dep,arr,price,days,seats,active) VALUES(?,?,?,?,?,?,?,?,1)', f.route, f.airline, f.no, f.dep, f.arr, f.price, f.days, f.seats);
  if (!n('posts')) for (const p of SEED.posts) ins('INSERT INTO posts(slug,title,excerpt,body,status) VALUES(?,?,?,?,?)', p.slug, p.title, p.excerpt, p.body, p.status);
  if (!n('reviews')) for (const r of SEED.reviews) ins('INSERT INTO reviews(name,trip,rating,text,status) VALUES(?,?,?,?,?)', r.name, r.trip, r.rating, r.text, 'live');
}

const g = globalThis;
export const db = g.__bzdb || (g.__bzdb = open());
const clean = (a) => a.map((x) => (x === undefined ? null : x));
export const all = (sql, ...a) => db.prepare(sql).all(...clean(a));
export const get = (sql, ...a) => db.prepare(sql).get(...clean(a));
export const run = (sql, ...a) => db.prepare(sql).run(...clean(a));
export const tx = (fn) => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };
