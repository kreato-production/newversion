# SPRINT-08 Sessao do Frontend e Migracao de Gravacoes

## Objetivo

Remover o principal gargalo remanescente da migracao: fazer o frontend operar com a sessao oficial do backend e migrar `gravacoes` como proximo modulo central de alto impacto.

## Duracao sugerida

2 a 3 semanas

## Justificativa

Depois das Sprints 4, 5, 6 e 7, o backend proprio ja possui autenticacao, autorizacao, tenancy, modulo piloto, primeiro modulo central e base minima de observabilidade. O bloqueio atual para ampliar a migracao e que o frontend ainda depende do fluxo antigo de sessao em partes relevantes da aplicacao.

Sem resolver isso, a API nova continua subutilizada e a remocao progressiva do Supabase fica travada.

## Resultados esperados

- frontend autenticando e renovando sessao pelo backend proprio
- contexto de usuario e tenant vindo do backend
- modulo `gravacoes` operando via API propria
- reducao concreta das chamadas diretas ao Supabase em fluxos centrais
- base preparada para desligamento progressivo do auth legado

## Escopo

- migracao da sessao oficial do frontend
- integracao de access token e refresh token
- adaptacao do `AuthContext` para backend proprio
- migracao do modulo `gravacoes`
- revisao dos contratos de tenant e permissao no frontend
- ativacao controlada por configuracao, se necessario

## Entregaveis

- sessao oficial do frontend ligada ao backend proprio
- mecanismo de refresh token integrado ao cliente HTTP
- `AuthContext` desacoplado do Supabase para autenticacao principal
- backend de `gravacoes` implementado com regras de tenant e role
- frontend de `gravacoes` consumindo repositorio/API propria
- plano de fallback e rollback da sessao

## Tarefas

1. Mapear todo o fluxo atual de login, logout, refresh, bootstrap de usuario e tenant no frontend.
2. Adaptar o cliente HTTP para envio e renovacao de tokens do backend.
3. Refatorar `AuthContext` e pontos de bootstrap de sessao para usar `/auth/login`, `/auth/refresh` e `/auth/me`.
4. Garantir que o tenant context e as permissoes exibidas na UI passem a depender da sessao emitida pelo backend.
5. Implementar o dominio de `gravacoes` no backend com contrato, repositorio, servico e rotas protegidas.
6. Refatorar a tela e os componentes de `gravacoes` no frontend para consumir repositorio tipado e API propria.
7. Medir e registrar quais chamadas diretas ao Supabase deixaram de existir apos a sprint.
8. Documentar estrategia de rollback da sessao caso a ativacao completa precise ser revertida.
9. Criar e executar testes unitarios, testes de integracao e smoke tests do escopo entregue.

## Dependencias

- Sprint 4 concluida com auth e tenancy no backend
- Sprint 5 concluida com camada HTTP e modulos piloto
- Sprint 6 concluida parcialmente com padrao de migracao para modulo central
- Sprint 7 concluida com observabilidade e readiness no backend

## Riscos principais

- regressao de login e perda de sessao no frontend
- divergencia entre tenant context antigo e novo
- dependencias indiretas do Supabase ainda espalhadas em componentes auxiliares
- necessidade de conviver temporariamente com modo hibrido durante a ativacao

## Mitigacoes

- ativacao controlada por configuracao ou provider selecionavel
- smoke tests de login, refresh e acesso ao modulo `gravacoes`
- validacao progressiva em ambiente local antes de trocar o fluxo padrao
- documentacao clara de rollback do bootstrap de sessao

## Criterios de aceite

- login do frontend funcionando com emissao de token pelo backend proprio
- refresh de sessao funcionando sem depender do Supabase auth
- `AuthContext` consumindo o backend como fonte oficial de sessao
- modulo `gravacoes` com backend proprio e frontend integrado
- reducao documentada de chamadas diretas ao Supabase no escopo da sprint
- testes do escopo da sprint criados
- testes executados ao final da sprint
- resultado da execucao registrado no encerramento da sprint

## Definicao de pronto

A Sprint 8 so sera considerada concluida quando o frontend conseguir:

- autenticar um usuario pelo backend
- restaurar a sessao ao recarregar a aplicacao
- renovar access token expirado com refresh token
- consultar o contexto autenticado em `/auth/me`
- acessar `gravacoes` pelo backend proprio sem depender do Supabase auth

## Evidencias esperadas ao final

- arquivos de auth do frontend refatorados
- contratos e repositorios de `gravacoes` no backend e frontend
- testes de auth frontend e backend atualizados
- smoke test cobrindo login, refresh, `/auth/me` e fluxo minimo de `gravacoes`
- documentacao da sprint atualizada com resultado real das validacoes

## Status

Concluida em 25-03-2026, com ativacao controlada e modo hibrido residual para perfil/permissoes legadas.

## O que foi entregue

### 1. Sessao oficial do frontend via backend proprio

Foi criada a base de autenticacao do frontend sobre a API propria:

- login em `/auth/login`
- restauracao de sessao via `/auth/me`
- renovacao de token via `/auth/refresh`
- persistencia local de `accessToken` e `refreshToken`
- retry automatico no cliente HTTP quando houver `401`

Arquivos principais:

- `src/lib/api/http.ts`
- `src/modules/auth/auth.repository.ts`
- `src/contexts/AuthContext.tsx`

### 2. AuthContext migrado para backend como fonte oficial de sessao

O `AuthContext` deixou de depender do ciclo de sessao do Supabase para o fluxo principal de autenticacao. A sessao oficial agora vem do backend proprio, com provider selecionavel por configuracao.

Observacao importante:

- o carregamento de perfil detalhado ainda usa a base legada para preservar `perfil`, `unidadeIds` e compatibilidade com a matriz atual de permissoes

### 3. Backend de `gravacoes` implementado

Foi criado o dominio inicial de `gravacoes` no backend com:

- modelo Prisma
- repositorio
- servico
- rotas protegidas por tenant e role

Arquivos principais:

- `backend/prisma/schema.prisma`
- `backend/src/modules/gravacoes/gravacoes.repository.ts`
- `backend/src/modules/gravacoes/gravacoes.service.ts`
- `backend/src/modules/gravacoes/routes/index.ts`
- `backend/src/app.ts`

### 4. Frontend de `gravacoes` ligado a repositorio proprio

Foi criada a camada de dados do modulo em `src/modules/gravacoes/*` e um fluxo de UI especifico para o modo backend, preservando o fluxo legado enquanto a ativacao estiver desligada.

Arquivos principais:

- `src/modules/gravacoes/gravacoes.types.ts`
- `src/modules/gravacoes/gravacoes.repository.ts`
- `src/modules/gravacoes/gravacoes.api.repository.ts`
- `src/modules/gravacoes/gravacoes.repository.provider.ts`
- `src/components/producao/BackendGravacaoList.tsx`
- `src/components/producao/GravacaoBackendFormModal.tsx`
- `src/pages/producao/GravacaoList.tsx`

### 5. Reducao concreta do acoplamento ao Supabase no escopo da sprint

Chamadas diretas ao Supabase removidas do fluxo principal de autenticacao:

- login
- restauracao de sessao
- renovacao de token

Chamadas diretas ao Supabase removidas do fluxo principal de `gravacoes` em modo backend:

- listagem
- criacao
- edicao
- exclusao

## Limitacoes assumidas nesta entrega

- o perfil detalhado do usuario e a matriz atual de permissoes ainda dependem da base legada
- o fluxo backend de `gravacoes` cobre o CRUD principal e nao todas as tabs auxiliares antigas
- por isso a ativacao permanece controlada por configuracao, evitando regressao brusca do fluxo legado

## Validacoes executadas

Validacoes finais executadas em 25-03-2026:

### Backend

- `npm run test`: aprovado
- `npm run build`: aprovado
- `npm run prisma:generate`: aprovado

Resultado backend:

- 17 arquivos de teste aprovados
- 28 testes aprovados
- 0 falhas

### Frontend

- `npx tsc --noEmit`: aprovado
- `npm run test -- src/lib/api/http.test.ts src/modules/auth/auth.repository.test.ts src/modules/gravacoes/gravacoes.repository.test.ts src/modules/programas/programas.repository.test.ts`: aprovado

Resultado frontend:

- 4 arquivos de teste aprovados
- 11 testes aprovados
- 0 falhas

## Observacoes operacionais

- os testes foram executados com permissao elevada por causa das restricoes do ambiente local
- a ativacao pratica do novo fluxo de sessao depende de configuracao do provider no frontend
- o rollback e simples: manter `VITE_AUTH_PROVIDER` e `VITE_DATA_PROVIDER` fora do modo `backend`

## Resultado da sprint

A Sprint 8 fechou a migracao do fluxo principal de sessao para o backend proprio e abriu a migracao real de `gravacoes` com backend, frontend, testes e validacao operacional. O projeto ainda opera em modo hibrido em partes de perfil e permissao, mas o gargalo principal da autenticacao centralizada foi removido.

## Observacao estrategica

Esta sprint consolidou a transicao do produto de uma prova arquitetural para uma execucao integrada. A partir daqui, os proximos modulos podem migrar com muito menos atrito porque o frontend ja consegue operar com sessao oficial do backend.
