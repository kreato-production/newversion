# SPRINT-17 - Desligamento Final do Supabase

## Status

Concluida em 06/04/2026.

## Objetivo

Remover o modo hibrido, apagar os fallbacks e deixar a aplicacao operando exclusivamente com backend proprio e PostgreSQL local.

## Duracao sugerida

1 semana

## Contexto de entrada

- ao final das sprints anteriores, a meta era zerar as referencias operacionais restantes
- o frontend ainda carregava credenciais, cliente compartilhado e fallbacks legados

## Escopo

- `src/integrations/supabase/client.ts`
- variaveis `VITE_SUPABASE_*` e `NEXT_PUBLIC_SUPABASE_*`
- fallbacks condicionais por providers legados
- adaptadores legado ainda presentes em `src/modules/*`
- limpeza da documentacao operacional
- remocao da pasta `supabase/`

## Entregaveis

- remocao das credenciais de Supabase do `.env` e `.env.local`
- remocao do cliente compartilhado de Supabase do frontend
- fim dos providers duplos onde o backend ja e obrigatorio
- remocao da pasta `supabase/` do repositorio
- checklist final de desligamento concluido

## Tarefas

1. [x] Rodar auditoria final com `rg` em `src/` para zerar `supabase.from` e imports do cliente
2. [x] Remover `src/integrations/supabase/client.ts` e dependencias que nao foram mais necessarias
3. [x] Eliminar fallbacks `SupabaseRepository` dos modulos migrados
4. [x] Remover credenciais `VITE_SUPABASE_*` e `NEXT_PUBLIC_SUPABASE_*`
5. [x] Atualizar documentacao: setup local, desligamento hibrido e checklist de release
6. [x] Remover a pasta `supabase/` do repositorio

## Criterios de aceitacao

- [x] `rg "supabase\\.from|integrations/supabase/client" src` retorna vazio
- [x] frontend sobe e autentica apenas contra `http://localhost:3333`
- [x] `.env` e `.env.local` nao contem mais credenciais de Supabase
- [x] CRUDs e consultas principais funcionam no ambiente local sem dependencia externa
- [x] documentacao de operacao reflete o estado final

## Evidencias de fechamento

- `npm run build` concluido com sucesso apos a remocao do legado
- `package.json` nao contem `@supabase/supabase-js`
- `rg -n "supabase|Supabase|useSupabaseData" src` retorna vazio
- o runtime principal do app opera somente com backend proprio

## Riscos residuais

- permanecem referencias historicas ao Supabase em documentos antigos de analise e historico de sprints
- qualquer afirmacao sobre "zero Supabase no repositorio inteiro" depende de remover ou arquivar essa documentacao historica
