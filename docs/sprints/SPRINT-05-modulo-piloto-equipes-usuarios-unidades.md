# SPRINT-05 Modulo Piloto Equipes, Usuarios e Unidades

## Objetivo

Validar a nova arquitetura com um conjunto pequeno, importante e controlavel de modulos.

## Duracao sugerida

2 semanas

## Resultados esperados

- primeiro fluxo real operando fora do Supabase
- frontend consumindo API propria
- padrao de migracao validado

## Escopo

- migrar `usuarios`
- migrar `unidades de negocio`
- migrar `equipes`

## Entregaveis

- endpoints backend desses modulos
- repositorios frontend apontando para API propria
- UI desses modulos adaptada
- validacao funcional ponta a ponta

## Tarefas

1. Implementar CRUD de usuarios no backend
2. Implementar CRUD de unidades no backend
3. Implementar CRUD de equipes no backend
4. Criar DTOs e validacoes
5. Atualizar frontend dos modulos piloto
6. Remover dependencia direta do Supabase nesses modulos
7. Validar autorizacao por tenant e role

## Criterios de aceite

- tres modulos piloto operando sem chamadas diretas ao Supabase
- dados persistidos no PostgreSQL local
- frontend funcional com API propria
- testes do escopo da sprint criados
- testes executados ao final da sprint

## Status da execucao

- status atual: avancada, com backend piloto concluido e frontend preparado parcialmente
- CRUD backend de `equipes`, `unidades` e `users` implementado
- camada HTTP do frontend criada para consumo da API propria
- troca total da UI ainda depende da migracao do fluxo de sessao do frontend para os tokens do backend e da migracao de operacoes auxiliares ainda acopladas ao Supabase

## Evidencias da entrega

- `backend/src/modules/equipes/*` com CRUD de equipes e rotas protegidas
- `backend/src/modules/unidades/*` com CRUD de unidades e rotas protegidas
- `backend/src/modules/users/*` com CRUD de usuarios e rotas protegidas
- `backend/src/modules/common/access.ts` com regras compartilhadas de tenancy
- `src/lib/api/http.ts` com cliente HTTP base para o backend proprio
- `src/modules/equipes/equipes.api.repository.ts` preparado para consumo da API
- `src/modules/unidades/unidades.api.repository.ts` preparado para consumo da API
- `src/modules/usuarios/usuarios.api.repository.ts` preparado para consumo da API

## Resultado dos testes e validacoes

- testes do backend: `npm run test` executado com sucesso em 25/03/2026
- resultado de testes backend: 10 arquivos aprovados, 17 testes aprovados
- build do backend: `npm run build` executado com sucesso em 25/03/2026
- validacao do Prisma: `npm run prisma:generate` executado com sucesso em 25/03/2026
- testes do frontend: `npm run test -- src/lib/api/http.test.ts src/modules/auth/auth.repository.test.ts src/modules/equipes/equipes.repository.test.ts src/modules/unidades/unidades.repository.test.ts` executado com sucesso em 25/03/2026
- resultado de testes frontend: 4 arquivos aprovados, 10 testes aprovados
- validacao de tipos frontend: `npx tsc --noEmit` executado com sucesso em 25/03/2026

## Observacoes

- a autenticacao do frontend ainda nao foi trocada para usar os tokens emitidos pelo backend, por isso os repositorios HTTP foram preparados sem ativacao total na UI
- `equipes` e `unidades` ainda possuem operacoes auxiliares dependentes do Supabase, como membros de equipe e upload de logo
- o fechamento completo da migracao piloto depende da proxima etapa de integracao do frontend com a sessao do backend e da substituicao dessas operacoes auxiliares
