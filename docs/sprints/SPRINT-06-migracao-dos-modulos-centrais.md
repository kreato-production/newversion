# SPRINT-06 Migracao dos Modulos Centrais

## Objetivo

Expandir o modelo validado no piloto para os modulos centrais de negocio.

## Duracao sugerida

2 a 4 semanas

## Resultados esperados

- modulos principais em migracao ativa
- reducao forte de acoplamento ao Supabase
- backend assumindo regras de negocio relevantes

## Escopo

- producao
- gravacoes
- conteudos
- recursos humanos
- recursos tecnicos
- recursos fisicos

## Entregaveis

- endpoints centrais implementados
- contratos de dominio publicados
- modulo a modulo adaptado no frontend
- plano de desligamento progressivo do Supabase

## Tarefas

1. Priorizar modulos por impacto e complexidade
2. Migrar queries e mutacoes para API propria
3. Mover regras de negocio do frontend para backend
4. Modularizar componentes gigantes quando necessario
5. Padronizar cache e invalidacao no React Query
6. Definir estrategia de migracao de dados e rollback

## Criterios de aceite

- modulos centrais com backend proprio
- regras criticas fora do frontend
- reducao mensuravel das chamadas diretas ao Supabase
- testes do escopo da sprint criados
- testes executados ao final da sprint

