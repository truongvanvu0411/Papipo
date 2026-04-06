'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@papipo.local');
  const [password, setPassword] = useState('ChangeMe123!');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch('/api/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? 'Login failed');
      setSubmitting(false);
      return;
    }

    router.replace('/');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <label className="stack">
        <span className="eyebrow">Email</span>
        <input className="auth-input" value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className="stack">
        <span className="eyebrow">Password</span>
        <input
          type="password"
          className="auth-input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p style={{ color: '#c0392b', margin: 0 }}>{error}</p> : null}
      <button className="action-button primary" type="submit" disabled={submitting}>
        {submitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
