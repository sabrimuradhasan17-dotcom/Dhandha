import { notFound } from 'next/navigation';
import { postBySlug, settings } from '@/lib/queries.js';
import { Crumbs, JsonLd, waUrl } from '@/components/Shared.js';
import { SITE_URL } from '@/lib/util.js';
export function generateMetadata({ params }) { const p = postBySlug(params.slug); return p ? { title: p.title, description: p.excerpt, alternates: { canonical: `/blog/${p.slug}` }, openGraph: { type: 'article' } } : {}; }
export default function Post({ params }) {
  const p = postBySlug(params.slug); if (!p) notFound();
  return <article className="sec wrap prose"><Crumbs items={[['Blog', '/blog'], [p.title]]} />
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt, datePublished: p.created_at, mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`, publisher: { '@type': 'Organization', name: 'La Bhutanz Tours' } }} />
    <h1>{p.title}</h1>{p.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
    <a className="btn wa" target="_blank" rel="noopener" href={waUrl(settings(), `Hi, I read "${p.title}" and want help planning.`)}>Ask us on WhatsApp</a></article>;
}
