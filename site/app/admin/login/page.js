import { login } from '../actions.js';
import { getUser } from '@/lib/auth.js';
import { redirect } from 'next/navigation';
export default function Login({ searchParams: q }) {
  if (getUser()) redirect('/admin');
  return <section className="sec wrap"><div className="card body" style={{ maxWidth: 400, margin: '40px auto' }}><h1 style={{ fontSize: 28 }}>Admin login</h1>
    {q.error && <p className="err" role="alert">{q.error}</p>}
    <form action={login}><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="username" /><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" />
      <p><button className="btn">Sign in</button></p></form></div></section>;
}
