# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (root)
```sh
npm run dev              # Vite dev server on :8080
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Vitest (37 tests, jsdom environment)
npm run test:coverage    # Vitest with v8 coverage report
npx vitest run src/path/to/file.test.tsx  # Run a single test file
```

### Backend (`backend/`)
```sh
npm run dev              # tsx watch src/server.ts (hot-reload, port 3333)
npm run build            # tsc → dist/
npm test                 # Vitest (28 tests, no DB needed)
npm run test:coverage    # Vitest with coverage
npx vitest run src/path/to/file.test.ts   # Run a single test file
npm run prisma:migrate   # prisma migrate dev
npm run prisma:push      # prisma db push (schema-first, no migration files)
npm run prisma:generate  # regenerate Prisma Client
```

### Root shortcuts for backend
```sh
npm run backend:dev
npm run backend:test
npm run backend:prisma:push
```

### Infrastructure
```sh
docker compose up postgres -d   # Start PostgreSQL only
docker compose up -d            # Start PostgreSQL + backend
docker build -t kreato-backend ./backend
```

## Architecture

### Two-app monorepo

```
root/          → Frontend: React 18 + Vite + TypeScript
backend/       → Backend:  Fastify 5 + Prisma 6 + TypeScript (ESM)
```

The two apps are independent npm workspaces. The frontend calls `http://localhost:3333` by default. Feature flags (`VITE_DATA_PROVIDER`, `VITE_AUTH_PROVIDER`) in the root `.env` control whether data comes from the backend or the legacy Supabase integration.

### Backend architecture

Pattern: **Repository → Service → Routes** per module.

```
backend/src/
  app.ts                      # buildApp() factory (used by server.ts AND tests)
  modules/<module>/
    <module>.repository.ts    # Interface + PrismaXxxRepository (raw SQL or Prisma)
    <module>.service.ts       # Business logic, receives repository via constructor
    routes/index.ts           # Fastify plugin returned by createXxxRoutes(authService, service)
  plugins/
    auth.ts                   # createAuthenticate / createRequireRole / createRequireTenantAccess
    observability.ts          # Request logging, correlationId header
  lib/
    prisma.ts                 # Singleton PrismaClient
    security/                 # jwt.ts, password.ts (scrypt), hash.ts (sha256)
  config/
    env.ts                    # Zod-validated env, cached singleton; test overrides applied here
```

**Dependency injection**: `buildApp(options?)` accepts optional service overrides — all tests pass in-memory implementations this way, never touching the database.

**Auth flow**: httpOnly cookies (`kreato_access_token`, `kreato_refresh_token`). The `createAuthenticate` preHandler reads the token from `Authorization: Bearer` header first, then falls back to the cookie. JWT secrets are HMAC-SHA256, 96-char hex in production.

**Multi-tenancy**: Every protected route uses `requireTenantAccess`. Services enforce `actor.tenantId` isolation. `GLOBAL_ADMIN` users have `tenantId = null` and bypass tenant filters.

**Pagination**: All list endpoints accept `?limit=` (max 200, default 50) and `?offset=`. Services return `{ data: T[], total: number }`. Repositories use `prisma.$transaction([count, findMany])`.

**Error types**: `AuthError` (401/403) and `AccessError` (403) are caught by `authErrorHandler` in `app.ts`. `ZodError` is also caught and returns 400.

### Frontend architecture

**Provider tree** (in `App.tsx`): `QueryClientProvider` → `ThemeProvider` → `AuthProvider` → `LanguageProvider` → `TooltipProvider` → `Router`.

**Auth**: `AuthContext` exposes `user`, `isAuthenticated`, `login()`, `logout()`. It delegates to `authRepository` (from `src/modules/auth/auth.repository.ts`), which is either `SupabaseAuthRepository` or `BackendAuthRepository` based on `isBackendAuthProviderEnabled()`.

**Data fetching**: Legacy Supabase modules use direct Supabase client calls. Migrated modules use `apiRequest()` from `src/lib/api/http.ts` with `credentials: 'include'` (cookie-based auth). The `gravacoesRepository` provider pattern (`gravacoes.repository.provider.ts`) returns the correct implementation based on `isBackendDataProviderEnabled()`.

**Code splitting**: All 40+ page imports in `App.tsx` use `React.lazy()` grouped by section (produção, recursos, admin), wrapped in `<Suspense fallback={<PageLoader />}>`.

**Permissions**: `usePermissions()` hook from `src/hooks/usePermissions.ts` exposes `hasPermission`, `canIncluir`, `canAlterar`, `canExcluir`. The `PermissionGate` component (`src/components/layout/PermissionGate.tsx`) wraps content behind a permission check.

### Testing conventions

**Backend tests** never hit the database. Each test file defines an `InMemoryXxxRepository` that implements the repository interface. Route tests use `buildApp({ service: new XxxService(new InMemoryXxxRepository()) })` + `app.inject()`. All `listByTenant` methods return `{ data, total }`.

**Frontend tests** use `vitest` + `@testing-library/react` with jsdom. Supabase and repository modules are mocked with `vi.mock()`. Setup file: `src/test/setup.ts` (jest-dom + matchMedia stub).

### Key files to understand before making changes

| File | Why it matters |
|---|---|
| `backend/src/app.ts` | Central wiring — all modules registered here |
| `backend/src/plugins/auth.ts` | Auth middleware used on every protected route |
| `backend/src/fastify.d.ts` | Declares `request.user: SessionUser` on FastifyRequest |
| `backend/src/config/env.ts` | All env vars validated here; test env overrides applied here |
| `src/lib/api/http.ts` | All backend HTTP calls go through `apiRequest()`; handles 401 → refresh retry |
| `src/modules/auth/auth.repository.ts` | Dual implementation (Supabase / Backend); `authRepository` singleton exported at bottom |
| `src/contexts/AuthContext.tsx` | Single source of truth for auth state on the frontend |

### Supabase deprecation status

The codebase is mid-migration from Supabase to a self-hosted backend. ~75 files still reference Supabase — mostly in `src/components/producao/`, `src/components/recursos/`, and `src/pages/`. The migration plan is documented in `docs/operacao/plano-desligamento-supabase.md`. When working on already-migrated modules (gravações, programas, equipes, unidades, users), use the backend API. When working on not-yet-migrated modules, use the existing Supabase pattern.

### Environment variables

Backend requires `DATABASE_URL`, `JWT_ACCESS_SECRET` (≥32 chars), `JWT_REFRESH_SECRET` (≥32 chars) in `backend/.env`. In `NODE_ENV=test`, the env module supplies safe defaults — tests run without a real `.env`.

Frontend flags in root `.env` that control routing behavior:
- `VITE_DATA_PROVIDER=backend` — use own backend for data
- `VITE_AUTH_PROVIDER=backend` — use own backend for auth
- `VITE_BACKEND_API_URL` — defaults to `http://localhost:3333`
