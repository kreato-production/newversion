# Kreato — Sistema de Gestão de Produção

Sistema web para gestão de gravações, programas, equipes e recursos de produção audiovisual.

[![CI](https://github.com/seu-org/kreatoproduction/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-org/kreatoproduction/actions/workflows/ci.yml)

## Arquitetura

```
┌─────────────────────┐     ┌────────────────────────┐     ┌──────────────┐
│  Frontend (React 18) │────▶│  Backend (Fastify 5)   │────▶│  PostgreSQL  │
│  Vite + TypeScript   │     │  Prisma ORM + Zod       │     │  (Docker)    │
│  TanStack Query      │     │  JWT + httpOnly Cookies │     │              │
└─────────────────────┘     └────────────────────────┘     └──────────────┘
```

- **Frontend**: React 18, TypeScript, Vite, shadcn/ui, TanStack Query, React Router v6
- **Backend**: Fastify 5, Prisma 6, PostgreSQL, Zod, JWT (HMAC-SHA256)
- **Auth**: httpOnly cookies, refresh token rotation, multi-tenancy

## Pré-requisitos

- Node.js 22+
- Docker e Docker Compose
- npm 10+

## Setup local

### 1. Clone e instale as dependências

```sh
git clone <URL_DO_REPO>
cd kreatoproduction

# Dependências do frontend
npm install

# Dependências do backend
cd backend && npm install && cd ..
```

### 2. Configure as variáveis de ambiente

```sh
# Banco de dados e backend
cp backend/.env.example backend/.env
# Edite backend/.env com suas chaves JWT e configurações
```

Variáveis obrigatórias em `backend/.env`:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `JWT_ACCESS_SECRET` | Segredo HMAC para access tokens (mín. 32 chars) |
| `JWT_REFRESH_SECRET` | Segredo HMAC para refresh tokens (mín. 32 chars) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `CORS_ORIGIN` | Origem permitida para CORS (ex: `http://localhost:8080`) |

Variáveis opcionais no `.env` da raiz (frontend):

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_BACKEND_API_URL` | `http://localhost:3333` | URL da API backend |
| `VITE_DATA_PROVIDER` | `backend` | `backend` ou `supabase` |
| `VITE_AUTH_PROVIDER` | `backend` | `backend` ou `supabase` |

### 3. Suba o banco de dados

```sh
docker compose up postgres -d
```

### 4. Aplique o schema do banco

```sh
npm run backend:prisma:push
# ou para criar migrations rastreadas:
cd backend && npm run prisma:migrate
```

### 5. Inicie o ambiente de desenvolvimento

```sh
# Terminal 1 — Backend
npm run backend:dev

# Terminal 2 — Frontend
npm run dev
```

- Frontend: http://localhost:8080
- Backend: http://localhost:3333
- API Docs (Swagger): http://localhost:3333/docs

## Comandos disponíveis

### Frontend (raiz)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint em todo o projeto |
| `npm test` | Executa os testes com Vitest |
| `npm run test:coverage` | Testes com relatório de cobertura |

### Backend (`backend/`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o backend com hot-reload (tsx watch) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Inicia o servidor compilado |
| `npm test` | Executa os testes Vitest |
| `npm run test:coverage` | Testes com cobertura |
| `npm run prisma:migrate` | Executa migrations do Prisma |
| `npm run prisma:generate` | Regenera o Prisma Client |

### Via raiz (atalhos)

| Comando | Descrição |
|---|---|
| `npm run backend:dev` | Inicia o backend |
| `npm run backend:test` | Testa o backend |
| `npm run backend:prisma:push` | Aplica schema sem migration |

## Docker (produção)

```sh
# Build e iniciar tudo
docker compose up -d

# Apenas o backend
docker build -t kreato-backend ./backend
docker run -p 3333:3333 --env-file backend/.env kreato-backend
```

## Estrutura do projeto

```
kreatoproduction/
├── src/                        # Frontend React
│   ├── components/             # Componentes reutilizáveis
│   ├── contexts/               # Contextos React (Auth, Language)
│   ├── hooks/                  # Custom hooks
│   ├── modules/                # Módulos de negócio (repositórios, tipos)
│   ├── pages/                  # Páginas da aplicação
│   └── lib/api/                # Camada HTTP / comunicação com backend
├── backend/
│   ├── src/
│   │   ├── modules/            # Módulos: auth, gravacoes, programas, ...
│   │   ├── plugins/            # Plugins Fastify (auth, observability)
│   │   ├── routes/             # Rotas utilitárias (health, ready)
│   │   ├── config/             # Configuração de ambiente e logger
│   │   └── lib/                # Utilitários (prisma, security)
│   └── prisma/
│       └── schema.prisma       # Schema do banco de dados
├── docs/                       # Documentação técnica e sprints
├── docker-compose.yml
└── .github/workflows/ci.yml    # Pipeline CI/CD
```

## Testes

```sh
# Frontend (37 testes)
npm test

# Backend (28 testes)
npm run backend:test
```

Os testes do backend não requerem banco de dados — usam repositórios in-memory e `app.inject()`.
