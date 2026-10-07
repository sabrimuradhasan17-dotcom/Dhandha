import { requireUser } from '@/lib/auth.js';
import { listPosts } from '@/lib/queries.js';
import { Flash, Field, Del } from '@/components/Admin.js';
import { savePost, deletePost } from '../../actions.js';
function PostForm({ p = {}, label }) {
  return <form action={savePost} className="card body" style={{ marginBottom: 12 }}>{p.id && <input type="hidden" name="id" value={p.id} />}
    <Field name="title" label="Title" def={p.title} required /><Field name="slug" label="URL slug (blank = from title)" def={p.slug} /><Field name="excerpt" label="Short summary (also the meta description)" def={p.excerpt} maxLength={300} />
    <Field name="body" label="Article (blank line = new paragraph)" area rows={8} def={p.body} /><div><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={p.status || 'draft'}><option value="live">Live</option><option value="draft">Draft</option></select></div><p><button className="btn sm">{label}</button></p></form>;
}
export default function Posts({ searchParams: q }) {
  const u = requireUser(), ps = listPosts({ live: false });
  return <><Flash q={q} /><h1>Blog</h1><details><summary>+ New post</summary><PostForm label="Create post" /></details>
    {ps.map((p) => <details key={p.id}><summary>{p.title} <span className={`badge ${p.status === 'live' ? '' : 'off'}`}>{p.status}</span></summary><PostForm p={p} label="Save changes" />{u.role === 'owner' && <Del action={deletePost} id={p.id} />}</details>)}</>;
}
