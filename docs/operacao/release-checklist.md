# Release Checklist

## Antes da release

- backend com `npm run test` verde
- backend com `npm run build` verde
- backend com `npm run prisma:generate` verde
- frontend com testes do escopo verde
- validacao de tipos verde
- documentacao da sprint atualizada

## Durante a release

- aplicar migracoes de banco
- subir nova versao do backend
- validar `GET /health`
- validar `GET /ready`
- validar request tracing por `x-request-id`

## Depois da release

- executar smoke de login
- executar smoke do modulo piloto
- executar smoke do modulo central migrado
- acompanhar logs e erros nas primeiras janelas de uso

## Go No-Go

Nao liberar se qualquer item critico acima falhar.
