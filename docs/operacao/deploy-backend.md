# Deploy Backend

## Objetivo

Padronizar o deploy do backend proprio.

## Pre-requisitos

- variaveis de ambiente configuradas
- PostgreSQL acessivel
- `npm install` executado em `backend/`

## Checklist de deploy

1. validar `npm run test`
2. validar `npm run build`
3. validar `npm run prisma:generate`
4. aplicar migracoes com `npm run prisma:push` ou fluxo equivalente
5. subir a API com `npm run start`
6. validar `GET /health`
7. validar `GET /ready`
8. executar smoke de login e modulo piloto

## Variaveis minimas

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `SERVICE_NAME`
- `APP_VERSION`

## Validacao pos-deploy

- verificar logs com `x-request-id`
- verificar readiness do banco
- validar login administrativo
- validar modulo piloto `programas`
