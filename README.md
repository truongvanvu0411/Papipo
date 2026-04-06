# Papipo Platform

Papipo is now organized as a multi-app platform:

- `apps/mobile`: Flutter mobile app for end users
- `apps/admin`: Next.js admin dashboard
- `apps/api`: NestJS API with PostgreSQL + Prisma
- `packages/contracts`: shared TypeScript contracts for API/admin
- `packages/design-spec`: design tokens extracted from the prototype UI
- `legacy/prototype-web`: original React prototype kept as a reference

## Local development

1. Copy the root `.env.example` to `.env` and fill in the secrets.
2. Install workspace dependencies:

```bash
npm install
```

3. Generate the Prisma client and run database migrations:

```bash
npm run db:generate
npm run db:migrate
```

4. Seed the first admin account:

```bash
npm run seed:admin --workspace @papipo/api
```

Or seed both the admin account and a demo end-user with onboarding/dashboard data:

```bash
npm run seed:fixtures --workspace @papipo/api
```

5. Start the API and admin dashboard in separate terminals:

```bash
npm run dev:api
npm run dev:admin
```

The admin dashboard now uses a real login flow. Use the seeded admin credentials on `/login` instead of setting an env token shortcut.

## Docker

The root `docker-compose.yml` starts PostgreSQL, the NestJS API, and the Next.js admin dashboard:

```bash
npm run docker:up
```

The Flutter app is scaffolded in the repo and should be run locally with the Flutter SDK, pointing to the API in the compose stack.

### Default local ports

- Admin: `http://localhost:3002`
- API: `http://localhost:4000`
- Swagger: `http://localhost:4000/docs`
- PostgreSQL: `localhost:5432`

### Local seed accounts

After `seed:fixtures`, local development uses:

- Admin: `admin@papipo.local` / `ChangeMe123!`
- Demo user: `demo@papipo.local` / `ChangeMe123!`

## Runbook

### Start from Docker

```bash
npm run docker:up
```

### Rebuild changed services

```bash
docker compose build api admin
docker compose up -d api admin
```

### Reset database locally

This will remove local PostgreSQL data for the Docker stack and requires reseeding afterward.

```bash
docker compose down -v
npm run docker:up
npm run seed:fixtures --workspace @papipo/api
```

### Local smoke checks

1. Open admin login at `http://localhost:3002/login`
2. Check API health at `http://localhost:4000/health`
3. Check Swagger at `http://localhost:4000/docs`
4. Log in as admin and confirm the dashboard plus a user detail page load
5. Log in as the demo user from Flutter and verify dashboard, nutrition, workout, and AI coach load

### Verification commands

Run API checks sequentially on Windows because both commands call `prisma generate`:

```bash
npm run lint --workspace @papipo/api
npm run test --workspace @papipo/api
```

Then verify frontend/mobile:

```bash
npm run build --workspace @papipo/admin
cd apps/mobile
flutter analyze
flutter test
```

## Current implementation status

- NestJS foundation with JWT auth, refresh/logout/password reset flows, onboarding/dashboard endpoints, AI coach endpoints with rate limiting and provider fallback, nutrition image-analysis/re-plan endpoints, workout endpoints, admin 360 endpoints, and fixture seeding
- Next.js admin shell wired to the API for login, overview, filtering, detail, richer 360 activity, AI history, and status management
- Flutter user core wired to the API for auth, onboarding, dashboard, hydration, habit toggles, check-ins, nutrition logging/re-plan/photo analysis, workout tracking with a local exercise catalog, AI coach, and profile editing
- Prototype preserved under `legacy/prototype-web`
