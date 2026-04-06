import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminToken } from '../../lib/session';
import { LoginForm } from './ui/login-form';

export default async function AdminLoginPage() {
  const token = await getAdminToken();
  if (token) {
    redirect('/');
  }

  return (
    <main className="page-shell" style={{ maxWidth: 520 }}>
      <section className="hero">
        <span className="eyebrow">Papipo Admin Access</span>
        <h1>Sign in</h1>
        <p>Use your admin account to manage users, monitor progress, and inspect platform activity.</p>
      </section>

      <article className="card">
        <LoginForm />
        <p className="muted" style={{ marginTop: 16 }}>
          Local dev admin seed: <code>admin@papipo.local</code>
        </p>
        <p className="muted">
          <Link href="/">Back to dashboard</Link>
        </p>
      </article>
    </main>
  );
}
