# Plano de Desligamento do Modo Hibrido de Auth e Autorizacao

## Objetivo

Descrever como ativar o fluxo oficial de autenticacao e autorizacao via backend proprio e como reverter rapidamente caso haja regressao.

## Flags de ativacao

O frontend controla a ativacao por configuracao:

- `VITE_AUTH_PROVIDER=backend`
- `VITE_DATA_PROVIDER=backend`

## Pre-condicoes antes do corte

- backend com `/auth/login`, `/auth/refresh` e `/auth/me` operacionais
- `AuthContext` carregando perfil, modulos e permissoes via API propria
- `usePermissions` sem consultas diretas ao Supabase no bootstrap do app
- testes da sprint executados e aprovados
- smoke test do fluxo autenticado aprovado

## Passos para ativar

1. Configurar `VITE_AUTH_PROVIDER=backend`.
2. Configurar `VITE_DATA_PROVIDER=backend` para os modulos ja migrados.
3. Validar localmente:
   - login
   - restauracao de sessao
   - refresh de token
   - carregamento de menu e modulos habilitados
   - acesso a telas protegidas
4. Publicar em ambiente controlado.
5. Monitorar erros de login, `401`, `403` e falhas de bootstrap.

## Sinais de sucesso

- menu lateral e hub de modulos respeitando `enabledModules`
- telas protegidas obedecendo `permissions`
- ausencia de consultas diretas ao Supabase no bootstrap de permissao
- fluxo autenticado funcionando apos refresh da pagina

## Rollback rapido

Se houver regressao funcional relevante:

1. Remover `VITE_AUTH_PROVIDER=backend`.
2. Remover `VITE_DATA_PROVIDER=backend` ou voltar apenas os modulos impactados.
3. Rebuildar o frontend com a configuracao anterior.
4. Revalidar login e navegação no fluxo legado.

## Observacao

O rollback nao exige reversao de schema ou limpeza de tokens no banco. O retorno ao fluxo anterior e feito no frontend por configuracao, preservando a possibilidade de nova tentativa controlada depois dos ajustes.
