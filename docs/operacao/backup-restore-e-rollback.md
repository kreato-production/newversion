# Backup Restore e Rollback

## Objetivo

Definir o procedimento minimo de protecao operacional do banco e da aplicacao.

## Backup PostgreSQL

Exemplo com `pg_dump`:

```sh
pg_dump "%DATABASE_URL%" --format=custom --file=kreato-backup.dump
```

## Restore PostgreSQL

Exemplo com `pg_restore`:

```sh
pg_restore --clean --if-exists --dbname="%DATABASE_URL%" kreato-backup.dump
```

## Politica minima recomendada

- backup diario em ambiente produtivo
- retencao de 7 a 30 dias conforme criticidade
- teste periodico de restore em ambiente separado

## Rollback de aplicacao

1. interromper a versao atual
2. restaurar a ultima versao estavel do backend
3. validar `GET /health`
4. validar `GET /ready`
5. executar smoke de login e modulo piloto

## Rollback de dados

1. isolar escrita na aplicacao
2. restaurar backup validado
3. reexecutar verificacoes de readiness
4. validar fluxo critico com smoke test

## Observacao

Rollback de dados deve ser usado apenas quando rollback de aplicacao nao for suficiente.
