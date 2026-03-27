# SPRINT-12 — Testes, CI/CD e Infraestrutura

## Objetivo

Estabelecer pipeline de qualidade automatizado, cobertura de testes no frontend, documentação
de API e infraestrutura containerizada para o backend.

## Duração sugerida

2 semanas

## Resultados esperados

- Testes de componentes React funcionando
- Pipeline CI/CD rodando em cada PR e push para `main`
- Backend com Dockerfile e documentação OpenAPI
- README.md real do projeto
- Banco de dados com schema Prisma consistente

## Escopo

- Testes de componentes com `@testing-library/react`
- Cobertura de código com `vitest coverage`
- GitHub Actions para lint, testes e build
- Dockerfile para o backend
- Swagger/OpenAPI via `@fastify/swagger`
- README.md substituindo o template genérico
- Prettier + Husky + lint-staged
- Correção da divergência entre schema Prisma e SQL de inicialização
- Fix do N+1 em `generateUniqueSlug`
- Planejamento de remoção do código Supabase legado

## Entregáveis

- Suite de testes de componentes para fluxos principais
- Relatório de cobertura com threshold mínimo definido
- Workflow CI no GitHub Actions (`.github/workflows/ci.yml`)
- `backend/Dockerfile` e instruções de uso
- Documentação OpenAPI acessível em `/docs`
- `README.md` com setup, arquitetura e comandos
- `schema.prisma` alinhado com o SQL de inicialização
- Plano documentado para desligamento do Supabase

## Tarefas

### 1. Testes de componentes React
- **Dependência:** `@testing-library/react` (já instalada), `@testing-library/user-event`
- Criar testes para os componentes críticos:
  - `src/components/producao/ProgramaFormModal.tsx` — formulário com validação
  - `src/pages/producao/GravacaoList.tsx` — renderização de lista e filtros
  - `src/components/layout/PermissionGate.tsx` — controle de visibilidade por permissão
  - `src/contexts/AuthContext.tsx` — login, logout, refresh de token
- Configurar `src/test/setup.ts` com `@testing-library/jest-dom`

### 2. Cobertura de código
- **Frontend:** Configurar `vitest coverage` com provider `v8`
- **Backend:** Configurar `c8` ou `vitest coverage` no `backend/package.json`
- Definir thresholds mínimos: statements 60%, branches 50%
- Gerar relatório HTML em `coverage/`

### 3. GitHub Actions — CI/CD
- **Arquivo:** `.github/workflows/ci.yml`
- Jobs em paralelo:
  - `lint-frontend`: `npm run lint` + `tsc --noEmit`
  - `test-frontend`: `npm run test -- --run`
  - `lint-backend`: `cd backend && npm run lint`
  - `test-backend`: `cd backend && npm test`
- Trigger: push em qualquer branch + PR para `main`
- Cache de `node_modules` para ambos os projetos
- Adicionar badge de status no README

### 4. Dockerfile para o backend
- **Arquivo:** `backend/Dockerfile`
- Multi-stage build: `builder` (compila TypeScript) + `runner` (apenas dist + node_modules de prod)
- Base image: `node:22-alpine`
- Expor porta 3333
- Incluir `backend/.dockerignore`
- Atualizar `docker-compose.yml` para incluir serviço `backend` além do PostgreSQL

### 5. Documentação OpenAPI com Fastify Swagger
- Instalar `@fastify/swagger` e `@fastify/swagger-ui`
- Registrar plugin em `backend/src/server.ts`
- Adicionar schemas de resposta nas rotas com Zod (`zod-to-json-schema` ou manual)
- Documentação acessível em `GET /docs` (desabilitada em produção)

### 6. README.md real do projeto
- **Arquivo:** `README.md` (raiz)
- Substituir template genérico do Lovable por documentação real:
  - Descrição do sistema
  - Arquitetura (Frontend React + Backend Fastify + PostgreSQL)
  - Pré-requisitos (Node 22, Docker)
  - Setup local (passo a passo)
  - Comandos disponíveis (`npm run dev`, `npm run backend:dev`, etc.)
  - Variáveis de ambiente necessárias
  - Link para `/docs` da API

### 7. Prettier + Husky + lint-staged
- Instalar `prettier`, `husky`, `lint-staged` como devDependencies (raiz)
- Criar `.prettierrc` com configuração padrão do projeto
- Configurar `lint-staged` para rodar `eslint --fix` + `prettier --write` nos arquivos staged
- Inicializar hooks com `husky init`

### 8. Corrigir divergência Prisma vs SQL de inicialização
- **Arquivos:**
  - `backend/prisma/schema.prisma` — adicionar campos `plano` e `notas` ao model `Tenant`
  - `backend/scripts/init-kreato-local.sql` — verificar e alinhar nomes de colunas com o schema Prisma
- Criar migration Prisma para os campos faltantes
- Substituir raw queries de `tenants.repository.ts` por queries Prisma quando possível

### 9. Fix do N+1 em `generateUniqueSlug`
- **Arquivo:** `backend/src/modules/tenants/tenants.repository.ts` (linhas 177-191)
- O loop `while(true)` faz uma query por iteração para verificar unicidade
- Solução: buscar slugs existentes com prefixo de uma vez só (`WHERE slug LIKE 'base-slug%'`) e determinar o próximo sufixo em memória

### 10. Plano de desligamento do Supabase
- **Arquivo:** `docs/operacao/plano-desligamento-supabase.md`
- Documentar todos os arquivos que ainda referenciam Supabase
- Definir critério de ativação (100% das rotas migradas para o backend próprio)
- Listar passos para remover: `@supabase/supabase-js`, arquivos `*.supabase.*`, variáveis `VITE_SUPABASE_*`
- Estimar esforço e definir sprint alvo

## Critérios de Aceitação

- [ ] `npm test` no frontend passa com pelo menos 10 testes de componentes
- [ ] Relatório de cobertura gerado com threshold configurado
- [ ] PR de exemplo passa em todos os jobs do CI sem erros
- [ ] `docker build -t kreato-backend ./backend` funciona sem erros
- [ ] `GET /docs` retorna UI do Swagger com todas as rotas documentadas
- [ ] `README.md` permite que um desenvolvedor novo suba o ambiente do zero
- [ ] `npx prisma migrate dev` roda sem divergências após correção do schema
- [ ] `generateUniqueSlug` faz no máximo 2 queries independente do número de slugs existentes
