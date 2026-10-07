import { listPosts, seoFor } from '@/lib/queries.js';
import { Crumbs, PostCard } from '@/components/Shared.js';
export function generateMetadata() { const s = seoFor('blog'); return { title: s.title, description: s.description, alternates: { canonical: '/blog' } }; }
export default function Blog() { return <section className="sec wrap"><Crumbs items={[['Blog']]} /><h1>Bhutan travel blog</h1><div className="grid">{listPosts().map((p) => <PostCard key={p.id} p={p} />)}</div></section>; }
