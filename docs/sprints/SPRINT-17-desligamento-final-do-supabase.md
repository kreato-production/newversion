# SPRINT-17 - Desligamento Final do Supabase

## Objetivo

Remover o modo hibrido, apagar os fallbacks e deixar a aplicacao operando exclusivamente com backend proprio e PostgreSQL local.

## Duracao sugerida

1 semana

## Contexto de entrada

- ao final das sprints anteriores, a meta e zerar as referencias operacionais restantes
- hoje ainda existem credenciais e cliente Supabase ativos no frontend

## Escopo

- `src/integrations/supabase/client.ts`
- variaveis `VITE_SUPABASE_*` no frontend
- fallbacks condicionais por `isBackendDataProviderEnabled()`
- adaptadores legado ainda presentes em `src/modules/*`
- limpeza da documentacao operacional

## Entregaveis

- remocao das credenciais de Supabase do `.env`
- remocao do cliente compartilhado de Supabase do frontend
- fim dos providers duplos onde o backend ja e obrigatorio
- checklist final de desligamento concluido

## Tarefas

1. Rodar auditoria final com `rg` em `src/` para zerar `supabase.from` e imports do cliente
2. Remover `src/integrations/supabase/client.ts` e dependencias que nao forem mais necessarias
3. Eliminar fallbacks `SupabaseRepository` dos modulos migrados
4. Remover `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID`
5. Atualizar documentacao: setup local, desligamento hibrido e checklist de release

## Criterios de aceitacao

- [ ] `rg "supabase\\.from|integrations/supabase/client" src` retorna vazio
- [ ] frontend sobe e autentica apenas contra `http://localhost:3333`
- [ ] `.env` nao contem mais credenciais de Supabase
- [ ] CRUDs e consultas principais funcionam no ambiente local sem dependencia externa
- [ ] documentacao de operacao reflete o estado final

## Riscos

- remocao prematura de fallback quebrar uma tela esquecida
- necessidade de smoke test completo antes de apagar o legado
