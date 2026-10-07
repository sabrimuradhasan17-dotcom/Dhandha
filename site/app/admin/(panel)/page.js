import Link from 'next/link';
import { all, get } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';
import { listTours } from '@/lib/queries.js';
import { Flash } from '@/components/Admin.js';
export default function Overview({ searchParams: q }) {
  const u = requireUser(), tours = listTours({ live: false });
  const issues = tours.filter((t) => t.status === 'live').flatMap((t) => [(!t.seo_title || t.seo_title.length > 60) && `“${t.name}”: SEO title missing or over 60 characters`, (!t.seo_desc || t.seo_desc.length > 160) && `“${t.name}”: SEO description missing or over 160 characters`].filter(Boolean).map((m) => [m, t.id]));
  const newE = get("SELECT COUNT(*) c FROM enquiries WHERE status='new'").c, recent = all('SELECT * FROM enquiries ORDER BY id DESC LIMIT 5'), log = u.role === 'owner' ? all('SELECT * FROM audit_log ORDER BY id DESC LIMIT 8') : [];
  return <><Flash q={q} /><h1>Overview</h1>
    <div className="stats"><div className="card stat">Live tours<b>{tours.filter((t) => t.status === 'live').length}/{tours.length}</b></div><div className="card stat">Flights<b>{get('SELECT COUNT(*) c FROM flights WHERE active=1').c}</b></div><div className="card stat">New enquiries<b>{newE}</b></div><div className="card stat">SEO issues<b>{issues.length}</b></div></div>
    <h3>Latest enquiries</h3>{recent.length ? <div className="tablewrap"><table><tbody>{recent.map((e) => <tr key={e.id}><td>{e.name}</td><td>{e.tour}</td><td>{e.when_text}</td><td><span className="badge">{e.status}</span></td></tr>)}</tbody></table></div> : <p className="muted">No enquiries yet.</p>}
    <p><Link href="/admin/enquiries">Open enquiries →</Link></p>
    <h3>SEO health</h3>{issues.length ? <ul>{issues.map(([m, id]) => <li key={m} className="bad"><Link href={`/admin/tours/${id}`}>{m}</Link></li>)}</ul> : <p className="ok">All live tours have SEO titles and descriptions of a good length.</p>}
    {log.length > 0 && <><h3>Recent activity</h3><div className="tablewrap"><table><tbody>{log.map((l) => <tr key={l.id}><td>{l.created_at}</td><td>{l.user_email}</td><td>{l.action}</td><td>{l.detail}</td></tr>)}</tbody></table></div></>}</>;
}
