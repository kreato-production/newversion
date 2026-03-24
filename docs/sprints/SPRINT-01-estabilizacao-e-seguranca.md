# SPRINT-01 Estabilizacao e Seguranca

## Objetivo

Reduzir os riscos imediatos do projeto e preparar o terreno para a migracao arquitetural.

## Duracao sugerida

2 semanas

## Resultados esperados

- falhas criticas de seguranca corrigidas
- pontos de acoplamento com Supabase mapeados
- decisoes tecnicas da nova arquitetura formalizadas
- backlog de migracao consolidado

## Escopo

- corrigir bootstrap de admin global
- remover credenciais hardcoded e respostas inseguras
- revisar edge functions sensiveis
- mapear dependencias do Supabase
- consolidar documentacao tecnica inicial

## Entregaveis

- correcao das funcoes sensiveis do Supabase
- documento de arquitetura alvo
- inventario de dependencias do Supabase
- backlog consolidado por modulo

## Tarefas

1. Corrigir `supabase/functions/seed-admin/index.ts`
2. Revisar `supabase/functions/admin-create-user/index.ts`
3. Mapear todos os pontos de uso do cliente Supabase no frontend
4. Mapear regras de negocio que hoje estao no frontend
5. Formalizar arquitetura alvo e responsabilidades por camada
6. Definir padrao de organizacao de modulos para a nova arquitetura

## Criterios de aceite

- nenhuma credencial sensivel hardcoded em fluxo critico
- nenhum endpoint administrativo devolvendo senha em resposta
- inventario do Supabase documentado
- arquitetura alvo aprovada internamente
- testes do escopo da sprint criados
- testes executados ao final da sprint

