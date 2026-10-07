import { all } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';
import { Flash } from '@/components/Admin.js';
import Counted from '@/components/Counted.js';
import { saveSeo } from '../../actions.js';
export default function Seo({ searchParams: q }) {
  requireUser(); const pages = all('SELECT * FROM seo_pages ORDER BY key');
  return <><Flash q={q} /><h1>SEO: page titles and descriptions</h1><p className="muted">Keep titles under 60 characters and descriptions under 160. Tour pages have their own SEO fields inside each tour.</p>
    <form action={saveSeo}>{pages.map((p) => <div className="card body" key={p.key} style={{ marginBottom: 12 }}><b>{p.key}</b><Counted name={`t_${p.key}`} label="Title" max={60} defaultValue={p.title} /><Counted name={`d_${p.key}`} label="Description" max={160} defaultValue={p.description} area /></div>)}<button className="btn">Save SEO</button></form></>;
}
