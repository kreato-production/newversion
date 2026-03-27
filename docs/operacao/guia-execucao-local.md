# Guia de Execucao Local

## Objetivo

Este guia prepara e executa a aplicacao localmente usando o backend proprio e o banco PostgreSQL local.

## URLs

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3333`
- Healthcheck: `http://localhost:3333/health`
- Readiness: `http://localhost:3333/ready`

## Pre-requisitos

- Node.js instalado
- npm instalado
- Docker Desktop instalado e em execucao

## Arquivos de ambiente

### Frontend

Arquivo: [`.env`](/c:/Projetos/Kreato_Local/kreatoproduction/.env)

Variaveis relevantes:

```env
VITE_BACKEND_API_URL="http://localhost:3333"
VITE_AUTH_PROVIDER="backend"
VITE_DATA_PROVIDER="backend"
```

### Backend

Arquivo: [`backend/.env`](/c:/Projetos/Kreato_Local/kreatoproduction/backend/.env)

Variaveis relevantes:

```env
PORT=3333
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kreato_local?schema=public
CORS_ORIGIN=http://localhost:8080
```

## Passo a passo

### 1. Subir o banco local

```bash
docker compose up -d postgres
```

### 2. Preparar o backend

```bash
cd backend
npm run prisma:generate
npm run prisma:push
npm run dev
```

### 3. Subir o frontend

Em outro terminal, na raiz do projeto:

```bash
npm run dev -- --host 0.0.0.0
```

## Validacoes

### Backend

- `GET http://localhost:3333/health` deve responder `200`
- `GET http://localhost:3333/ready` deve responder `200` com banco pronto ou `503` se o banco nao estiver disponivel

### Frontend

- abrir `http://localhost:8080`
- a interface deve carregar o app
- fluxos autenticados com backend dependem do PostgreSQL em execucao

## Observacoes do ambiente atual

- o frontend e o backend compilam com sucesso
- neste ambiente, o Docker nao esta instalado, entao o PostgreSQL local nao pode ser iniciado automaticamente daqui
- sem o banco, o backend pode subir para expor `/health`, mas rotas de autenticacao e dados ficam dependentes da base
