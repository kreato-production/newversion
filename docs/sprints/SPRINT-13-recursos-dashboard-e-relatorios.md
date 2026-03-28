# SPRINT-13 - Recursos, Dashboard e Relatorios

## Objetivo

Remover a dependencia direta do Supabase das telas de leitura e dos modulos base de recursos
que hoje contaminam varias areas do sistema.

## Duracao sugerida

2 semanas

## Contexto de entrada

- `Dashboard` ainda consulta Supabase diretamente
- `Recursos Humanos`, `Recursos Tecnicos` e `Recursos Fisicos` ainda estao no legado
- hooks de disponibilidade e consultas de apoio continuam acoplados ao cliente Supabase

## Escopo

- `src/pages/Dashboard.tsx`
- `src/pages/recursos/RecursosHumanos.tsx`
- `src/pages/recursos/RecursosTecnicos.tsx`
- `src/pages/recursos/RecursosFisicos.tsx`
- `src/hooks/useRecursoFisicoDisponibilidade.ts`
- `src/hooks/useGravacaoReportData.ts`
- modais e tabs diretamente dependentes desses modulos

## Entregaveis

- endpoints backend para recursos humanos, tecnicos e fisicos
- repositorios API no frontend para esses tres modulos
- dashboard consumindo apenas a API propria
- mapas auxiliares de disponibilidade sem `supabase.from`

## Tarefas

1. Criar backend para `recursos_humanos`, `recursos_tecnicos` e `recursos_fisicos`
2. Migrar CRUD principal e subtabelas: ausencias, escalas, anexos, estoque e faixas de disponibilidade
3. Trocar o frontend para `apiRequest()` + repositories providers
4. Migrar o `Dashboard` para endpoints agregados do backend
5. Revisar modais vinculados: `RecursoHumanoFormModal`, `RecursoTecnicoFormModal`, `MapaOciosidadeModal`, `MapaRecursosFisicosModal`

## Criterios de aceitacao

- [ ] `Dashboard` nao importa mais o cliente Supabase
- [ ] `Recursos Humanos` salva, lista e exclui sem chamadas ao Supabase
- [ ] `Recursos Tecnicos` salva, lista e exclui sem chamadas ao Supabase
- [ ] `Recursos Fisicos` salva, lista e exclui sem chamadas ao Supabase
- [ ] hooks de disponibilidade passam a usar backend proprio

## Riscos

- volume alto de tabelas auxiliares
- impacto direto em mapas e alocacao
