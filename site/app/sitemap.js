import { listTours, listPosts } from '@/lib/queries.js';
import { DEST } from '@/lib/seed-data.js';
import { SITE_URL } from '@/lib/util.js';
export const dynamic = 'force-dynamic';
export default function sitemap() {
  const u = (p, pr = 0.7) => ({ url: SITE_URL + p, priority: pr });
  return [u('/', 1), u('/tours', 0.9), u('/destinations', 0.7), u('/flights', 0.6), u('/blog', 0.6), u('/faq', 0.5), u('/about', 0.4), u('/plan', 0.5),
    ...listTours().map((t) => u(`/tours/${t.slug}`, 0.9)), ...DEST.map((d) => u(`/destinations/${d.slug}`)), ...listPosts().map((p) => u(`/blog/${p.slug}`, 0.6))];
}
