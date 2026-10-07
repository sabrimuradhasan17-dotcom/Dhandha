import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '@/lib/db.js';
const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };
export async function GET(_req, { params }) {
  const m = /^[a-z0-9]{8,40}\.(jpg|png|webp|avif)$/.exec(params.name);
  if (!m) return new Response('Not found', { status: 404 });
  const file = path.join(DATA_DIR, 'uploads', params.name);
  if (!fs.existsSync(file)) return new Response('Not found', { status: 404 });
  return new Response(fs.readFileSync(file), { headers: { 'Content-Type': TYPES[m[1]], 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
