# SPRINT-04 Autenticacao, Autorizacao e Tenancy

## Objetivo

Mover os pilares de acesso e seguranca para o backend proprio.

## Duracao sugerida

2 semanas

## Resultados esperados

- autenticacao centralizada no backend
- autorizacao baseada em roles e tenant
- tenant context definido
- sessao pronta para uso no frontend

## Escopo

- criar modulo de autenticacao
- implementar login
- implementar refresh token
- implementar validacao de tenant
- implementar roles e guards

## Entregaveis

- endpoints de login e refresh
- middleware de autenticacao
- middleware de tenant context
- middleware de autorizacao
- tabela ou estrategia de identidade definida

## Tarefas

1. Modelar usuarios e credenciais no backend
2. Implementar hash de senha
3. Implementar emissao de JWT
4. Implementar refresh token
5. Criar tenant guard
6. Criar role guard
7. Mover regra de validacao de licenca para backend

## Criterios de aceite

- autenticacao funcionando ponta a ponta
- tenant resolvido no backend
- autorizacao sem dependencia do frontend
- login basico utilizavel pelo frontend
- testes do escopo da sprint criados
- testes executados ao final da sprint

## Status da execucao

- status atual: concluida
- autenticacao base, refresh token, autorizacao por role e validacao de tenant implementados no backend
- sessao e contexto de acesso agora podem ser consumidos pelo frontend via API propria

## Evidencias da entrega

- `backend/src/modules/auth/auth.service.ts` com login, refresh e autenticacao por access token
- `backend/src/modules/auth/auth.repository.ts` com contrato de persistencia e implementacao Prisma
- `backend/src/modules/auth/routes/index.ts` com rotas `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` e `GET /auth/admin-access`
- `backend/src/plugins/auth.ts` com middlewares de autenticacao, tenant e role
- `backend/src/lib/security/password.ts` com hash e verificacao de senha
- `backend/src/lib/security/jwt.ts` com emissao e validacao de token
- `backend/prisma/schema.prisma` expandido com `RefreshToken` e `TenantLicense`

## Resultado dos testes e validacoes

- testes do backend: `npm run test` executado com sucesso em 25/03/2026
- resultado de testes: 4 arquivos aprovados, 8 testes aprovados
- build do backend: `npm run build` executado com sucesso em 25/03/2026
- validacao do Prisma: `npm run prisma:generate` executado com sucesso em 25/03/2026

## Observacoes

- a autenticacao ja esta centralizada no backend, mas o frontend ainda precisa ser migrado para consumir estes endpoints nas proximas sprints
- a persistencia relacional de refresh token e licenca foi preparada no schema Prisma, dependendo da aplicacao das migracoes no banco local quando o ambiente PostgreSQL estiver em execucao
