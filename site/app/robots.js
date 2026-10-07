import { SITE_URL } from '@/lib/util.js';
export default function robots() { return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/uploads/'] }, sitemap: `${SITE_URL}/sitemap.xml` }; }
