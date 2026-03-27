# SPRINT-06 Migracao dos Modulos Centrais

## Objetivo

Expandir o modelo validado no piloto para os modulos centrais de negocio.

## Duracao sugerida

2 a 4 semanas

## Resultados esperados

- modulos principais em migracao ativa
- reducao forte de acoplamento ao Supabase
- backend assumindo regras de negocio relevantes

## Escopo

- producao
- gravacoes
- conteudos
- recursos humanos
- recursos tecnicos
- recursos fisicos

## Entregaveis

- endpoints centrais implementados
- contratos de dominio publicados
- modulo a modulo adaptado no frontend
- plano de desligamento progressivo do Supabase

## Tarefas

1. Priorizar modulos por impacto e complexidade
2. Migrar queries e mutacoes para API propria
3. Mover regras de negocio do frontend para backend
4. Modularizar componentes gigantes quando necessario
5. Padronizar cache e invalidacao no React Query
6. Definir estrategia de migracao de dados e rollback

## Criterios de aceite

- modulos centrais com backend proprio
- regras criticas fora do frontend
- reducao mensuravel das chamadas diretas ao Supabase
- testes do escopo da sprint criados
- testes executados ao final da sprint

## Status da execucao

- status atual: em andamento, com `programas` migrado como primeiro modulo central priorizado
- backend proprio de `programas` implementado e registrado na API
- frontend de `programas` refatorado para consumir camada de repositorio em vez de acesso direto ao Supabase
- base do dominio central no backend foi ampliada no Prisma para suportar `programas`

## Evidencias da entrega

- `backend/src/modules/programas/*` com CRUD protegido de programas
- `backend/prisma/schema.prisma` expandido com o modelo `Programa`
- `src/modules/programas/*` com contrato de frontend, repositorio Supabase, repositorio API e provider
- `src/pages/producao/Programas.tsx` refatorado para usar repositorio
- `src/components/producao/ProgramaFormModal.tsx` desacoplado do cliente Supabase direto para carregamento de unidades via camada de dados

## Resultado dos testes e validacoes

- testes do backend: `npm run test` executado com sucesso em 25/03/2026
- resultado de testes backend: 12 arquivos aprovados, 20 testes aprovados
- build do backend: `npm run build` executado com sucesso em 25/03/2026
- validacao do Prisma: `npm run prisma:generate` executado com sucesso em 25/03/2026
- testes do frontend: `npm run test -- src/lib/api/http.test.ts src/modules/programas/programas.repository.test.ts src/modules/auth/auth.repository.test.ts` executado com sucesso em 25/03/2026
- resultado de testes frontend: 3 arquivos aprovados, 6 testes aprovados
- validacao de tipos frontend: `npx tsc --noEmit` executado com sucesso em 25/03/2026

## Observacoes

- esta rodada nao encerra a Sprint 6 inteira; ela abre a migracao central com um modulo de producao de impacto controlado
- `gravacoes`, `conteudos` e os modulos de recursos ainda permanecem dependentes do Supabase e seguem como proxima fila tecnica
- a ativacao total do consumo da API propria no frontend continua dependente da migracao da sessao do cliente para os tokens do backend
