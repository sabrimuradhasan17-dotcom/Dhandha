import Link from 'next/link';
import { requireUser } from '@/lib/auth.js';
import { logout } from '../actions.js';
export default function Panel({ children }) {
  const u = requireUser();
  const links = [['/admin', 'Overview'], ['/admin/tours', 'Tours and prices'], ['/admin/flights', 'Flights'], ['/admin/enquiries', 'Enquiries'], ['/admin/posts', 'Blog'], ['/admin/reviews', 'Reviews'], ['/admin/seo', 'SEO'], ...(u.role === 'owner' ? [['/admin/users', 'Users'], ['/admin/settings', 'Settings']] : []), ['/admin/account', 'My account']];
  return <div className="wrap admin"><aside className="side card body"><p className="muted">{u.name}<br /><b>{u.role}</b></p>
    {links.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}<Link href="/" target="_blank">View website ↗</Link>
    <form action={logout}><button className="btn alt sm" style={{ marginTop: 10 }}>Log out</button></form></aside>
    <div style={{ minWidth: 0 }}>{children}</div></div>;
}
