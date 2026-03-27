# SPRINT-10 — Segurança e Hardening

## Objetivo

Eliminar os riscos de segurança restantes identificados na análise técnica, com foco em proteção
das rotas de autenticação, correção do error handler e revisão do armazenamento de tokens.

## Duração sugerida

1 semana

## Resultados esperados

- Rotas de autenticação protegidas contra brute force
- Error handler seguro (sem vazamento de mensagens internas)
- Health check usando query parametrizada segura
- Tokens protegidos contra XSS
- Lógica de admin desacoplada de string hardcoded

## Escopo

- Rate limiting nas rotas críticas de autenticação
- Substituição de `$queryRawUnsafe` por `$queryRaw` no health check
- Correção do error handler no plugin de autenticação
- Migração de tokens do localStorage para httpOnly cookies
- Remoção de detecção de admin por string hardcoded

## Entregáveis

- Rate limiting configurado e testado
- `$queryRaw` com tagged template no health check
- Error handler retornando 500 + mensagem genérica para erros não tratados
- Tokens em httpOnly cookies com configuração de CSRF
- Lógica de `isGlobalAdmin` centralizada via role do usuário

## Tarefas

### 1. Rate Limiting nas rotas de autenticação
- **Arquivo:** `backend/src/modules/auth/routes/index.ts`
- Instalar `@fastify/rate-limit`
- Aplicar limite de 10 tentativas / 15 min em `POST /auth/login`
- Aplicar limite de 20 tentativas / 15 min em `POST /auth/refresh`
- Retornar `429 Too Many Requests` com `Retry-After` header

### 2. Substituir `$queryRawUnsafe` no health check
- **Arquivo:** `backend/src/routes/health/health.presenter.ts` (linha 28)
- Trocar `prisma.$queryRawUnsafe('SELECT 1')` por `prisma.$queryRaw\`SELECT 1\``
- Verificar se outros usos de `$queryRawUnsafe` existem no codebase

### 3. Corrigir error handler no plugin de autenticação
- **Arquivo:** `backend/src/plugins/auth.ts` (linha 57)
- O bloco `if (error instanceof Error)` retorna status 400 e `error.message` direto ao cliente
- Erros não esperados devem retornar 500 com mensagem genérica (`'Internal server error'`)
- Apenas `UnauthorizedError` e `ForbiddenError` devem retornar 401/403 com mensagem específica

### 4. Migrar tokens JWT para httpOnly cookies
- **Arquivo:** `src/lib/api/http.ts`
- Substituir armazenamento de `accessToken` e `refreshToken` em `localStorage` por cookies httpOnly
- Configurar backend para enviar `Set-Cookie` com flags: `httpOnly`, `sameSite: 'strict'`, `secure` (em prod)
- Atualizar `apiRequest()` para não mais enviar `Authorization: Bearer` manualmente (o cookie é enviado automaticamente)
- Rever CORS no backend para aceitar credenciais (`credentials: true`)

### 5. Centralizar lógica de admin global
- **Arquivos:**
  - `src/hooks/usePermissions.ts` (linha 38)
  - `src/components/layout/AppSidebar.tsx` (linha 70)
- Criar função utilitária `isGlobalAdmin(user)` baseada no campo `role` (`GLOBAL_ADMIN`), não em string de `usuario` ou `email`
- Substituir todas as ocorrências pela função centralizada

## Critérios de Aceitação

- [ ] `POST /auth/login` com 11 tentativas consecutivas retorna 429
- [ ] `POST /auth/login` com credenciais erradas não vaza stack trace
- [ ] Health check usa `$queryRaw` com template literal
- [ ] Tokens não aparecem em `localStorage` no DevTools do browser
- [ ] `isGlobalAdmin` não faz string matching em `usuario` ou `email`
