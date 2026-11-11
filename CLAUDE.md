# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (root)

```sh
npm run dev              # Next.js dev server (Turbopack) on :3001
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Vitest (jsdom environment)
npm run test:coverage    # Vitest with v8 coverage report
npx vitest run src/path/to/file.test.tsx  # Run a single test file
```

### Backend (`backend/`)

```sh
npm run dev              # tsx watch src/server.ts (hot-reload, port 3333)
npm run build            # tsc → dist/
npm test                 # Vitest (no DB needed)
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
root/          → Frontend: Next.js 16 (App Router) + React 18 + TypeScript
backend/       → Backend:  Fastify 5 + Prisma 6 + TypeScript (ESM)
```

The two apps are independent npm workspaces. The frontend calls `http://localhost:3333` by default and now runs against the own backend API by default.

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

**Routing**: Next.js App Router. Each route is a thin `src/app/(app)/<modulo>/<cadastro>/page.tsx` (`'use client'`) that renders a view from `src/views/`. `src/app/(app)/layout.tsx` wraps pages in `AppShell` (sidebar + breadcrumb); auth protection is done in middleware.

**Provider tree** (in `src/components/layout/Providers.tsx`): `QueryClientProvider` → `ThemeProvider` → `AuthProvider` → `LanguageProvider` → `TooltipProvider`.

**Auth**: `AuthContext` exposes `user`, `isAuthenticated`, `login()`, `logout()`. It is backed by Auth.js session state and the backend-only `authRepository` implementation from `src/modules/auth/auth.repository.ts`.

**Data fetching**: Frontend modules use `apiRequest()` from `src/lib/api/http.ts` with `credentials: 'include'` (cookie-based auth) and route browser traffic through `/api/proxy`.

**Cadastro form pages (not modals)**: cadastro screens open the form as a page, not a `Dialog`. Reference implementation: Pessoas. Migration plan for the remaining screens: `docs/formularios-em-pagina-inventario.md` (sprints 18-25).

- Routes: `<basePath>` (list), `<basePath>/novo` (create), `<basePath>/[id]` (edit/view); the `[id]` page reads the id with `useParams()` and renders the form with `key={id}`.
- `RecordRouteConfig` (`basePath`, `navStorageKey`) per module, e.g. `src/modules/pessoas/pessoas.navigation.ts`.
- List side: `useRecordList(config)` from `src/hooks/useRecordNavigation.ts` → `openNew()`, `openRecord(id, orderedIds)` (stores the filtered order in sessionStorage for previous/next).
- Form side: `useRecordNavigation(config, id)` → `goBack()`, `navigation`; `useRecordForm()` (`src/hooks/useRecordForm.ts`) → load by id, `formData`/`update`, `handleSubmit` with toasts; layout `<FormPage>` (`src/components/shared/FormPage.tsx`) → header, action bar (Voltar, anterior/próximo, Cancelar, Salvar) and the `<form id={formId}>` inside a card.
- Read-only when the user lacks `alterar` (edit) / `incluir` (create).
- Complex forms (sub-lists, calculated fields, own validation) use `<RecordFormPage>` (`src/components/shared/RecordFormPage.tsx`) with a `XxxFormBody` that receives `RecordFormBodyProps` (`formId`, `data`, `readOnly`, `onSubmit`), keeps its own field state initialized from `data`, and renders `<form id={formId}>` — e.g. `src/views/recursos/TurnoForm.tsx` + `src/components/recursos/TurnoFormBody.tsx`. If the `<form>` lives inside a tab, give that `TabsContent` `forceMount` so Save works from other tabs.
- Simple parametrizations (code, name, color, description, translations, flags, extra tabs) need no new component: write a `TituloFormConfig` and render `<TituloFormRoute config={...} />` from `src/components/shared/TituloFormPage.tsx` (examples in `src/modules/parametrizacoes/producao.forms.tsx`).
- Radix `<Select>`: if a form sets a select's value programmatically after mount while its options are still loading, Radix fires `onValueChange('')` and wipes it — ignore empty values in `onValueChange` (see the status select in `src/components/producao/TarefaFormBody.tsx`).
- Backend: each migrated module needs `GET /<recurso>/:id` (404 when missing, `ensureSameTenant` → 403) with a route test — see `backend/src/modules/pessoas`.
- Modals remain only for auxiliary actions (maps, reports, charts, pickers) and sub-records edited inside a form.

**Permissions**: `usePermissions()` hook from `src/hooks/usePermissions.ts` exposes `hasPermission`, `canIncluir`, `canAlterar`, `canExcluir`. The `PermissionGate` component (`src/components/layout/PermissionGate.tsx`) wraps content behind a permission check.

### Testing conventions

**Backend tests** never hit the database. Each test file defines an `InMemoryXxxRepository` that implements the repository interface. Route tests use `buildApp({ service: new XxxService(new InMemoryXxxRepository()) })` + `app.inject()`. All `listByTenant` methods return `{ data, total }`.

**Frontend tests** use `vitest` + `@testing-library/react` with jsdom. Repository/auth modules are mocked with `vi.mock()`. Setup file: `src/test/setup.ts` (jest-dom + matchMedia stub).

### Key files to understand before making changes

| File                                  | Why it matters                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `backend/src/app.ts`                  | Central wiring — all modules registered here                                  |
| `backend/src/plugins/auth.ts`         | Auth middleware used on every protected route                                 |
| `backend/src/fastify.d.ts`            | Declares `request.user: SessionUser` on FastifyRequest                        |
| `backend/src/config/env.ts`           | All env vars validated here; test env overrides applied here                  |
| `src/lib/api/http.ts`                 | All backend HTTP calls go through `apiRequest()`; handles 401 → refresh retry |
| `src/modules/auth/auth.repository.ts` | Backend auth contract and singleton used by the frontend                      |
| `src/contexts/AuthContext.tsx`        | Single source of truth for auth state on the frontend                         |

### Supabase deprecation status

The application runtime no longer contains active Supabase integrations. Remaining mentions are historical documentation about the migration and shutdown process.

### Environment variables

Backend requires `DATABASE_URL`, `JWT_ACCESS_SECRET` (≥32 chars), `JWT_REFRESH_SECRET` (≥32 chars) in `backend/.env`. In `NODE_ENV=test`, the env module supplies safe defaults — tests run without a real `.env`.

Frontend vars in root `.env` / `.env.local`:

- `NEXT_PUBLIC_BACKEND_API_URL` — defaults to `http://localhost:3333`
- `NEXT_PUBLIC_AUTH_PROVIDER=backend` — use own backend for auth
- `NEXT_PUBLIC_KEYCLOAK_AUTH_ENABLED=false` — keep SSO toggle hidden by default
