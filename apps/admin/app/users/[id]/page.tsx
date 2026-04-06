import Link from 'next/link';
import { getAdminUserActivity, getAdminUserDetail } from '../../../lib/api';

function formatDate(value: string | null) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function DetailCell({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="detail-cell">
      <strong>{label}</strong>
      <div>{value}</div>
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  children
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="card stack">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 style={{ marginTop: 8 }}>{title}</h2>
      </div>
      {children}
    </article>
  );
}

export default async function AdminUserDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, activity] = await Promise.all([getAdminUserDetail(id), getAdminUserActivity(id)]);

  if (!user) {
    return (
      <main className="page-shell">
        <div className="card">
          <div className="eyebrow">User detail</div>
          <h1 style={{ marginTop: 8 }}>User not available</h1>
          <p className="muted">The API may be offline, the token may be missing, or the user does not exist.</p>
          <Link href="/">Back to dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <Link href="/" className="eyebrow">
          Back to dashboard
        </Link>
        <h1>{user.profile?.name ?? user.email}</h1>
        <p>
          Complete user 360 for onboarding posture, daily health metrics, nutrition, workout execution,
          AI conversations, and administrative history.
        </p>
      </section>

      <section className="grid main">
        <SectionCard eyebrow="Profile" title="Identity and onboarding">
          <div className="detail-grid">
            <DetailCell label="Email" value={user.email} />
            <DetailCell label="Role" value={user.role} />
            <DetailCell label="Status" value={user.status} />
            <DetailCell label="Language" value={user.profile?.preferredLanguage ?? 'Not set'} />
            <DetailCell label="Onboarded" value={user.profile?.isOnboarded ? 'Yes' : 'No'} />
            <DetailCell label="Name" value={user.profile?.name ?? 'Not set'} />
            <DetailCell label="Goals" value={user.profile?.goals.join(', ') || 'Not set'} />
            <DetailCell label="Activity level" value={user.profile?.activityLevel ?? 'Not set'} />
            <DetailCell label="Plan duration" value={user.profile?.planDuration ?? 'Not set'} />
            <DetailCell
              label="Target change"
              value={
                user.profile?.targetWeightChangeKg != null
                  ? `${user.profile.targetWeightChangeKg} kg in ${user.profile.targetTimeframe ?? 'planned window'}`
                  : 'Not set'
              }
            />
            <DetailCell
              label="Favorite foods"
              value={user.profile?.favoriteFoods.join(', ') || 'Not set'}
            />
            <DetailCell
              label="Activity prefs"
              value={user.profile?.activityPrefs.join(', ') || 'Not set'}
            />
          </div>
          <div className="detail-cell">
            <strong>AI welcome</strong>
            <div>{user.profile?.aiWelcomeMessage ?? 'No AI welcome message has been generated yet.'}</div>
          </div>
        </SectionCard>

        <aside className="stack">
          <SectionCard eyebrow="Account timeline" title="Lifecycle">
            <div className="detail-grid">
              <DetailCell label="Created" value={formatDate(user.createdAt)} />
              <DetailCell label="Updated" value={formatDate(user.updatedAt)} />
              <DetailCell label="Last check-in" value={formatDate(user.profile?.lastCheckInDate ?? null)} />
            </div>
          </SectionCard>

          <SectionCard eyebrow="Account actions" title="Admin control">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`pill ${user.status === 'ACTIVE' ? 'secondary' : 'primary'}`}>{user.status}</span>
              <span className="pill primary">{user.role}</span>
            </div>
            <StatusAction userId={user.id} status={user.status} />
          </SectionCard>
        </aside>
      </section>

      <section className="grid main" style={{ marginTop: 24 }}>
        <SectionCard eyebrow="Daily metrics" title="Latest readiness snapshot">
          <div className="detail-grid">
            <DetailCell label="Metric date" value={formatDate(user.latestMetric?.date ?? null)} />
            <DetailCell label="Readiness" value={user.latestMetric?.readiness ?? 'Not set'} />
            <DetailCell label="Sleep score" value={user.latestMetric?.sleepScore ?? 'Not set'} />
            <DetailCell
              label="Calories"
              value={
                user.latestMetric
                  ? `${user.latestMetric.caloriesConsumed} / ${user.latestMetric.caloriesTarget}`
                  : 'Not set'
              }
            />
            <DetailCell
              label="Water"
              value={
                user.latestMetric
                  ? `${user.latestMetric.waterConsumedLiters}L / ${user.latestMetric.waterTargetLiters}L`
                  : 'Not set'
              }
            />
            <DetailCell label="Gems" value={user.latestMetric?.gems ?? 0} />
          </div>
          <div className="detail-cell">
            <strong>Daily insight</strong>
            <div>{user.latestMetric?.dailyInsight ?? 'No daily insight yet.'}</div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Check-in" title="Latest recovery report">
          <div className="detail-grid">
            <DetailCell label="Date" value={formatDate(user.latestCheckIn?.date ?? null)} />
            <DetailCell label="Sleep hours" value={user.latestCheckIn?.sleepHours ?? 'Not set'} />
            <DetailCell label="Sleep quality" value={user.latestCheckIn?.sleepQuality ?? 'Not set'} />
            <DetailCell label="Soreness" value={user.latestCheckIn?.soreness ?? 'Not set'} />
            <DetailCell label="Stress" value={user.latestCheckIn?.stress ?? 'Not set'} />
            <DetailCell label="Readiness" value={user.latestCheckIn?.readinessScore ?? 'Not set'} />
          </div>
          <div className="detail-cell">
            <strong>Check-in insight</strong>
            <div>{user.latestCheckIn?.insight ?? 'No check-in insight yet.'}</div>
          </div>
        </SectionCard>
      </section>

      <section className="grid main" style={{ marginTop: 24 }}>
        <SectionCard eyebrow="Nutrition" title="Latest intake snapshot">
          <div className="detail-grid">
            <DetailCell label="Date" value={formatDate(user.latestNutrition?.date ?? null)} />
            <DetailCell label="Calories" value={user.latestNutrition?.caloriesConsumed ?? 'Not set'} />
            <DetailCell label="Protein" value={user.latestNutrition?.proteinConsumed ?? 'Not set'} />
            <DetailCell label="Carbs" value={user.latestNutrition?.carbsConsumed ?? 'Not set'} />
            <DetailCell label="Fat" value={user.latestNutrition?.fatConsumed ?? 'Not set'} />
          </div>
          <div className="detail-cell">
            <strong>Nutrition insight</strong>
            <div>{user.latestNutrition?.nutritionInsight ?? 'No nutrition guidance yet.'}</div>
          </div>
          <div className="stack">
            {(activity?.mealLogs ?? []).map((item) => (
              <div key={item.id} className="detail-cell">
                <strong>{item.name}</strong>
                <div>{item.mealType}</div>
                <div className="muted">
                  {item.calories} kcal | {item.source ?? 'manual'} | {formatDate(item.date)}
                </div>
              </div>
            ))}
            {(activity?.mealLogs ?? []).length === 0 ? <p className="muted">No recent meal logs.</p> : null}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Workout" title="Current plan and completion">
          <div className="detail-grid">
            <DetailCell label="Title" value={user.latestWorkout?.title ?? 'No workout plan'} />
            <DetailCell label="Duration" value={user.latestWorkout?.duration ?? 'Not set'} />
            <DetailCell label="Intensity" value={user.latestWorkout?.intensity ?? 'Not set'} />
            <DetailCell label="Calories" value={user.latestWorkout?.calories ?? 'Not set'} />
            <DetailCell label="Completed" value={formatDate(user.latestWorkout?.completedAt ?? null)} />
          </div>
          <div className="stack">
            {(user.latestWorkout?.exercises ?? []).map((exercise) => (
              <div key={exercise.id} className="detail-cell">
                <strong>{exercise.name}</strong>
                <div>{exercise.sets} sets | {exercise.reps}</div>
                <div className="muted">{exercise.slug}</div>
              </div>
            ))}
            {(user.latestWorkout?.exercises ?? []).length === 0 ? (
              <p className="muted">No workout exercises available yet.</p>
            ) : null}
          </div>
        </SectionCard>
      </section>

      <section className="grid main" style={{ marginTop: 24 }}>
        <SectionCard eyebrow="AI coach" title="Conversation history">
          <div className="stack">
            {(activity?.aiConversations ?? []).map((conversation) => (
              <div key={conversation.id} className="detail-cell">
                <strong>{conversation.title ?? 'AI Coach'}</strong>
                <div className="muted">Updated {formatDate(conversation.updatedAt)}</div>
                <div style={{ marginTop: 8 }}>{conversation.lastMessagePreview ?? 'No messages yet.'}</div>
                <div className="stack" style={{ marginTop: 12 }}>
                  {conversation.messages.map((message) => (
                    <div key={message.id} style={{ padding: '10px 12px', borderRadius: 16, background: '#f4ead8' }}>
                      <strong>{message.role}</strong>
                      <div style={{ marginTop: 6 }}>{message.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(activity?.aiConversations ?? []).length === 0 ? <p className="muted">No AI conversations yet.</p> : null}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Audit" title="Recent admin actions">
          <div className="stack">
            {(activity?.auditTrail ?? []).map((item) => (
              <div key={item.id} className="detail-cell">
                <strong>{item.action}</strong>
                <div className="muted">{formatDate(item.createdAt)}</div>
                <div>{item.metadata ? JSON.stringify(item.metadata) : 'No metadata'}</div>
              </div>
            ))}
            {(activity?.auditTrail ?? []).length === 0 ? <p className="muted">No audit records yet.</p> : null}
          </div>
        </SectionCard>
      </section>
    </main>
  );
}

function StatusAction({ userId, status }: { userId: string; status: 'ACTIVE' | 'SUSPENDED' }) {
  return (
    <form
      action={`/api/users/${userId}/status`}
      method="post"
      style={{ marginTop: 16 }}
      onSubmit={undefined}
    >
      <input type="hidden" name="status" value={status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'} />
      <button
        className="action-button primary"
        formMethod="post"
        formAction={`/api/users/${userId}/status?status=${status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}`}
      >
        {status === 'ACTIVE' ? 'Suspend user' : 'Reactivate user'}
      </button>
    </form>
  );
}
