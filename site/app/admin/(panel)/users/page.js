import { all } from '@/lib/db.js';
import { requireUser } from '@/lib/auth.js';
import { Flash, Field, Del } from '@/components/Admin.js';
import { createUser, deleteUser, resetUserPassword } from '../../actions.js';
export default function Users({ searchParams: q }) {
  const me = requireUser('owner'), us = all('SELECT id,email,name,role FROM users ORDER BY id');
  return <><Flash q={q} /><h1>Users</h1><p className="muted">Owners can do everything. Staff can edit tours, prices, dates, flights, blog, reviews, SEO and enquiries, but cannot delete, manage users or change business settings.</p>
    <div className="tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Reset password</th><th></th></tr></thead><tbody>{us.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td>
      <td><form action={resetUserPassword} style={{ display: 'flex', gap: 4 }}><input type="hidden" name="id" value={u.id} /><input name="password" type="password" minLength={8} placeholder="New password" required autoComplete="new-password" /><button className="btn sm alt">Set</button></form></td>
      <td>{u.id !== me.id && <Del action={deleteUser} id={u.id} msg={`Delete ${u.email}?`} />}</td></tr>)}</tbody></table></div>
    <h3>Add user</h3><form action={createUser} className="card body"><div className="two"><Field name="name" label="Name" /><Field name="email" label="Email" type="email" required /><Field name="password" label="Password (min 8 characters)" type="password" required minLength={8} autoComplete="new-password" /><div><label htmlFor="role">Role</label><select id="role" name="role"><option value="staff">Staff</option><option value="owner">Owner</option></select></div></div><p><button className="btn sm">Create user</button></p></form></>;
}
