import { all, get } from './db.js';
import { parseJson } from './util.js';

export const settings = () => Object.fromEntries(all("SELECT key,value FROM settings WHERE key<>'session_secret'").map((r) => [r.key, r.value]));
export const seoFor = (key) => get('SELECT title,description FROM seo_pages WHERE key=?', key) || {};

function hydrate(t) {
  if (!t) return null;
  const dates = all('SELECT id,date,seats,price FROM tour_dates WHERE tour_id=? ORDER BY date', t.id);
  const itinerary = parseJson(t.itinerary);
  return { ...t, highlights: parseJson(t.highlights), inclusions: parseJson(t.inclusions), itinerary, days: itinerary.length, dates };
}
const today = () => new Date().toISOString().slice(0, 10);
export const upcoming = (t) => t.dates.filter((d) => d.date >= today());
export const listTours = ({ live = true } = {}) => all(`SELECT * FROM tours ${live ? "WHERE status='live'" : ''} ORDER BY id`).map(hydrate);
export const tourBySlug = (slug, { live = true } = {}) => hydrate(get(`SELECT * FROM tours WHERE slug=? ${live ? "AND status='live'" : ''}`, slug));
export const tourById = (id) => hydrate(get('SELECT * FROM tours WHERE id=?', id));
export const listFlights = ({ active = true } = {}) => all(`SELECT * FROM flights ${active ? 'WHERE active=1' : ''} ORDER BY id`);
export const listPosts = ({ live = true } = {}) => all(`SELECT * FROM posts ${live ? "WHERE status='live'" : ''} ORDER BY id DESC`);
export const postBySlug = (slug) => get("SELECT * FROM posts WHERE slug=? AND status='live'", slug);
export const listReviews = ({ live = true } = {}) => all(`SELECT * FROM reviews ${live ? "WHERE status='live'" : ''} ORDER BY id DESC`);
