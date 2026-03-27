# Backend Local

## Objetivo

Este backend e a base da migracao gradual do projeto para uma arquitetura propria, reduzindo a dependencia do Supabase.

## Stack inicial

- Fastify
- Prisma
- PostgreSQL
- Vitest

## Como subir o banco local

```sh
docker compose up -d postgres
```

## Como preparar o backend

```sh
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

## Healthcheck

A rota inicial da API e `GET /health`.

## Endpoints de autenticacao

- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /auth/admin-access`

## Endpoints piloto e centrais

- `GET|POST|PUT|DELETE /equipes`
- `GET|POST|PUT|DELETE /unidades`
- `GET|POST|PUT|DELETE /users`
- `GET|POST|PUT|DELETE /programas`

## Observacoes

- esta sprint entrega a fundacao da nova stack
- autenticacao, autorizacao e tenancy basicas ja estao centralizadas no backend
- o piloto de `equipes`, `unidades` e `users` ja possui CRUD no backend
- `programas` passou a ser o primeiro modulo central com backend proprio e camada de repositorio no frontend
- a troca total do frontend para todos os modulos centrais continua dependente da migracao do fluxo de sessao no cliente
