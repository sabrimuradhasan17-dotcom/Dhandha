'use server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { run } from '@/lib/db.js';
import { settings } from '@/lib/queries.js';
import { waUrl } from '@/components/Shared.js';

const hits = globalThis.__enqHits || (globalThis.__enqHits = new Map());
export async function submitEnquiry(formData) {
  const f = (k, n = 300) => String(formData.get(k) || '').trim().slice(0, n);
  if (f('website')) redirect('/'); // honeypot
  const name = f('name', 80), phone = f('phone', 20).replace(/[^\d+ ]/g, ''), tour = f('tour', 120) || 'Custom trip';
  const when = f('when', 40), msg = f('message', 800), pax = Math.min(Math.max(parseInt(f('pax', 3)) || 2, 1), 99), budget = f('budget', 30);
  if (!name || phone.replace(/\D/g, '').length < 7) redirect('/plan?error=' + encodeURIComponent('Please enter your name and a valid phone number.'));
  const ip = (headers().get('x-forwarded-for') || 'local').split(',')[0];
  const now = Date.now(), recent = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (recent.length >= 8) redirect('/plan?error=' + encodeURIComponent('Too many requests. Please message us on WhatsApp.'));
  hits.set(ip, [...recent, now]);
  run('INSERT INTO enquiries(name,phone,tour,when_text,pax,message) VALUES(?,?,?,?,?,?)', name, phone, tour, when, pax, [budget && `Budget: ${budget}`, msg].filter(Boolean).join('. '));
  redirect(waUrl(settings(), `Hi, I'm ${name} (${phone}). Interested in "${tour}" for ${pax} travellers${when ? ' in ' + when : ''}.${budget ? ' Budget: ' + budget + '.' : ''}${msg ? ' ' + msg : ''}`));
}
