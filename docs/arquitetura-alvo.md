# Arquitetura Alvo

## Objetivo

Definir a arquitetura alvo para reduzir a dependencia do Supabase e preparar o projeto para uma base de produto mais estavel.

## Principios

- frontend sem acesso direto ao banco
- regras de negocio sensiveis centralizadas no backend
- PostgreSQL como base de dados principal
- contratos tipados entre frontend e backend
- isolamento por tenant aplicado no backend
- autenticacao e autorizacao fora do cliente

## Arquitetura Proposta

### Frontend

- React
- TypeScript
- React Query
- modulos por dominio
- camada de repositorios e clientes HTTP

Responsabilidades:

- renderizacao
- experiencia do usuario
- cache de dados
- validacoes de interface

O frontend nao deve:

- acessar banco diretamente
- decidir regras de licenca
- decidir regras criticas de autorizacao
- manipular credenciais administrativas

### Backend

- Node.js
- Fastify
- TypeScript
- Prisma

Responsabilidades:

- autenticacao
- autorizacao
- tenancy
- validacao de regras de negocio
- auditoria
- API publica para o frontend

### Banco

- PostgreSQL local em desenvolvimento
- PostgreSQL self-hosted ou gerido em producao

Responsabilidades:

- persistencia
- consistencia relacional
- suporte a multi-tenant
- rastreabilidade e auditoria

## Modulos Alvo

### Modulos de plataforma

- auth
- tenants
- users
- permissions
- audit

### Modulos de negocio

- unidades
- equipes
- producao
- gravacoes
- conteudos
- recursos humanos
- recursos tecnicos
- recursos fisicos
- fornecedores

## Fluxo Alvo

1. frontend chama API propria
2. backend autentica e resolve tenant
3. backend valida regras de negocio
4. backend persiste ou consulta no PostgreSQL
5. backend devolve DTO tipado ao frontend

## Padrao de Organizacao Recomendado

### Frontend

- `src/modules/auth`
- `src/modules/users`
- `src/modules/tenants`
- `src/modules/equipes`
- `src/modules/unidades`

Cada modulo deve conter:

- `api`
- `hooks`
- `types`
- `components`
- `mappers`

### Backend

- `backend/src/modules/auth`
- `backend/src/modules/users`
- `backend/src/modules/tenants`
- `backend/src/modules/equipes`
- `backend/src/modules/unidades`

Cada modulo deve conter:

- `routes`
- `service`
- `repository`
- `dto`
- `schema`

## Regras Arquiteturais

- nenhuma tela nova pode consumir Supabase diretamente
- nenhuma regra critica nova deve nascer no frontend
- todo modulo novo precisa de contrato de entrada e saida
- toda operacao administrativa deve ser auditavel

## Estado Atual x Estado Alvo

### Estado atual

- forte acoplamento ao Supabase
- autenticacao dependente da plataforma
- autorizacao parcialmente distribuida no frontend
- regras criticas no cliente

### Estado alvo

- backend proprio
- banco proprio
- frontend desacoplado do fornecedor
- tenancy centralizado
- fluxo administrativo controlado
