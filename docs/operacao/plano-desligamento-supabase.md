# Plano de Desligamento do Supabase

## Status

Encerrado em 06/04/2026.

## Contexto

O sistema foi originado na plataforma Lovable com Supabase como backend-as-a-service. As sprints 10-17 concluiram a migracao para backend proprio em Fastify + PostgreSQL e o desligamento final do legado.

## Resultado final

- cliente compartilhado do Supabase removido do frontend
- repositorios hibridos simplificados para backend-only
- credenciais de Supabase removidas de `.env` e `.env.local`
- dependencia `@supabase/supabase-js` removida do `package.json`
- pasta `supabase/` removida do repositorio

## Passos executados

### 1. Remover integracao do frontend

- exclusao de `src/integrations/supabase/client.ts`
- exclusao de `src/integrations/supabase/types.ts`
- exclusao de `src/hooks/useSupabaseData.ts`

### 2. Simplificar auth e repositorios

- remocao de `SupabaseAuthRepository`
- remocao dos fallbacks `SupabaseRepository` nos modulos migrados
- consolidacao do fluxo de auth e dados no backend proprio

### 3. Remover dependencia e credenciais

- `npm uninstall @supabase/supabase-js`
- remocao de `VITE_SUPABASE_URL`
- remocao de `VITE_SUPABASE_ANON_KEY`
- remocao de `VITE_SUPABASE_PROJECT_ID`
- remocao de `NEXT_PUBLIC_SUPABASE_URL`
- remocao de `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 4. Remover artefatos legados do repositorio

- exclusao da pasta `supabase/`
- atualizacao da documentacao operacional e de sprint

## Validacao pos-desligamento

- [x] `npm run build` sem erros de import Supabase
- [x] testes-alvo do frontend mantem a trilha migrada verde
- [x] nenhum `@supabase` em `package.json`
- [x] nenhum `VITE_SUPABASE_*` ou `NEXT_PUBLIC_SUPABASE_*` em `.env` / `.env.local`
- [x] login/logout funcionando via cookies httpOnly
- [x] paginas e modulos do frontend operam via backend proprio

## Observacao

Referencias remanescentes ao termo "Supabase" em `docs/` sao historicas e servem apenas para registrar a migracao realizada.
