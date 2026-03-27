# SPRINT-03 Backend Base e PostgreSQL Local

## Objetivo

Subir a fundacao da nova stack backend e do banco local.

## Duracao sugerida

2 semanas

## Resultados esperados

- backend inicial criado
- PostgreSQL local operando
- ORM configurado
- pipeline basico de ambiente pronta

## Escopo

- criar projeto backend
- configurar Fastify
- configurar Prisma
- configurar Docker para PostgreSQL
- definir variaveis de ambiente
- preparar scripts de desenvolvimento

## Entregaveis

- pasta de backend criada
- `docker-compose` ou equivalente para PostgreSQL local
- schema inicial no ORM
- healthcheck da API

## Tarefas

1. Criar backend em TypeScript
2. Configurar Fastify
3. Configurar Prisma
4. Subir PostgreSQL local via Docker
5. Configurar conexao por ambiente
6. Criar rota `/health`
7. Definir padrao de logs estruturados

## Criterios de aceite

- backend sobe localmente
- banco local responde
- ORM conecta ao banco
- healthcheck funcionando
- testes do escopo da sprint criados
- testes executados ao final da sprint

## Status da execucao

- status atual: concluida com restricao operacional local
- backend base criado em `backend/`
- infraestrutura local preparada com `docker-compose.yml`
- schema inicial Prisma criado com foco em tenancy, usuarios, unidades e equipes

## Evidencias da entrega

- `backend/package.json` com scripts de desenvolvimento, build, testes e Prisma
- `backend/src/app.ts` com bootstrap Fastify
- `backend/src/routes/health/index.ts` com rota `GET /health`
- `backend/prisma/schema.prisma` com schema inicial PostgreSQL
- `backend/.env.example` com variaveis de ambiente da API
- `docker-compose.yml` com servico PostgreSQL local
- `backend/README.md` com instrucoes operacionais

## Resultado dos testes e validacoes

- instalacao de dependencias do backend: `npm install` executado com sucesso em 25/03/2026
- testes do backend: `npm run test` executado com sucesso em 25/03/2026
- resultado de testes: 2 arquivos aprovados, 3 testes aprovados
- build do backend: `npm run build` executado com sucesso em 25/03/2026
- validacao do Prisma: `npm run prisma:generate` executado com sucesso em 25/03/2026
- validacao do Docker: nao foi possivel executar `docker compose config` porque o comando `docker` nao esta disponivel neste ambiente local

## Observacoes

- a infraestrutura para PostgreSQL local foi entregue, mas a subida real do container depende de Docker instalado na maquina
- a rota de healthcheck foi implementada, porem a execucao da API depende de copiar `backend/.env.example` para `backend/.env`
