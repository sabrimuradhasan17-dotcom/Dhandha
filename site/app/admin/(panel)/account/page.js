import { requireUser } from '@/lib/auth.js';
import { Flash, Field } from '@/components/Admin.js';
import { changePassword } from '../../actions.js';
export default function Account({ searchParams: q }) {
  const u = requireUser();
  return <><Flash q={q} /><h1>My account</h1><p>{u.email} · {u.role}</p><form action={changePassword} className="card body" style={{ maxWidth: 420 }}><h3>Change password</h3>
    <Field name="current" label="Current password" type="password" required autoComplete="current-password" /><Field name="new" label="New password (min 8 characters)" type="password" required minLength={8} autoComplete="new-password" /><p><button className="btn">Update password</button></p></form></>;
}
