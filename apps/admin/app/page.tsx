import Link from 'next/link';
import type { AdminUserListItem } from '@papipo/contracts';
import { redirect } from 'next/navigation';
import { getAdminOverview, getAdminUsers } from '../lib/api';

function formatDate(value: string | null) {
  if (!value) return 'No activity yet';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium'
  }).format(new Date(value));
}

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const role = typeof params.role === 'string' ? params.role : undefined;
  const [overview, users] = await Promise.all([
    getAdminOverview(),
    getAdminUsers({
      search,
      status,
      role
    })
  ]);

  if (!overview) {
    redirect('/login');
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">Papipo Admin</span>
        <h1>User 360 Dashboard</h1>
        <p>
          This web dashboard is the new control center for user lifecycle, onboarding visibility,
          and operational monitoring while the Flutter app and NestJS API replace the prototype stack.
        </p>
      </section>

      <article className="card" style={{ marginBottom: 24 }}>
        <form className="toolbar" method="GET">
          <label className="field">
            <span className="eyebrow">Search</span>
            <input name="search" defaultValue={search} placeholder="Email or name" />
          </label>
          <label className="field">
            <span className="eyebrow">Status</span>
            <select name="status" defaultValue={status ?? ''}>
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </label>
          <label className="field">
            <span className="eyebrow">Role</span>
            <select name="role" defaultValue={role ?? ''}>
              <option value="">All</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
          </label>
          <button className="action-button primary" type="submit">
            Apply
          </button>
        </form>
      </article>

      <section className="grid metrics">
        <article className="card">
          <div className="eyebrow">Total users</div>
          <div className="metric-value">{overview?.totals.users ?? 0}</div>
        </article>
        <article className="card">
          <div className="eyebrow">Active</div>
          <div className="metric-value">{overview?.totals.activeUsers ?? 0}</div>
        </article>
        <article className="card">
          <div className="eyebrow">Suspended</div>
          <div className="metric-value">{overview?.totals.suspendedUsers ?? 0}</div>
        </article>
        <article className="card">
          <div className="eyebrow">Admins</div>
          <div className="metric-value">{overview?.totals.admins ?? 0}</div>
        </article>
      </section>

      <section className="grid main">
        <article className="card">
          <div className="stack">
            <div>
              <div className="eyebrow">Users</div>
              <h2 style={{ margin: '8px 0 0' }}>All accounts</h2>
            </div>

            {users.length === 0 ? (
              <p className="muted">
                No users are available yet. Start the API, seed an admin account, and create users to populate this table.
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Goals</th>
                    <th>State</th>
                    <th>Latest activity</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: AdminUserListItem) => (
                    <tr key={user.id}>
                      <td>
                        <Link href={`/users/${user.id}`}>
                          <strong>{user.profile?.name ?? user.email}</strong>
                          <div className="muted">{user.email}</div>
                        </Link>
                      </td>
                      <td>{user.profile?.goals.join(', ') || 'Not set'}</td>
                      <td>
                        <div className="pill primary">{user.role}</div>
                        <div style={{ height: 8 }} />
                        <div className="pill secondary">{user.status}</div>
                      </td>
                      <td>{formatDate(user.latestMetricDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>

        <aside className="stack">
          <article className="card">
            <div className="eyebrow">Recent signups</div>
            <h2 style={{ marginTop: 8 }}>Newest accounts</h2>
            <div className="stack">
                {(overview?.recentUsers ?? []).map((user: AdminUserListItem) => (
                <Link key={user.id} href={`/users/${user.id}`} className="detail-cell">
                  <strong>{user.profile?.name ?? user.email}</strong>
                  <div>{user.email}</div>
                  <div className="muted">{formatDate(user.createdAt)}</div>
                </Link>
              ))}
              {(!overview || overview.recentUsers.length === 0) && (
                <p className="muted">The recent user feed will appear here once the API has seeded data.</p>
              )}
            </div>
          </article>

          <article className="card">
            <div className="eyebrow">Migration note</div>
            <h2 style={{ marginTop: 8 }}>Prototype preserved</h2>
            <p className="muted">
              The original React prototype now lives under <code>legacy/prototype-web</code> and remains the visual reference while the production stack is implemented.
            </p>
            <form action="/api/session" method="post" style={{ marginTop: 12 }}>
              <button className="action-button secondary" formAction="/api/session?intent=logout" formMethod="post">
                Sign out
              </button>
            </form>
          </article>
        </aside>
      </section>
    </main>
  );
}
