# SPRINT-14 - Producao Operacional

## Objetivo

Eliminar o acoplamento do Supabase nas telas operacionais de producao que ainda fazem CRUD e
consultas principais fora do backend local.

## Duracao sugerida

2 semanas

## Contexto de entrada

- os modulos principais de `Tarefas`, `Incidencias de Gravacao` e `Mapas` ja estao na trilha backend
- a sprint passa a focar em consolidacao operacional, validacao profunda de interface e remanescentes de UX/contrato

## Escopo

- `src/pages/producao/Tarefas.tsx`
- `src/pages/producao/IncidenciasGravacao.tsx`
- `src/pages/producao/Mapas.tsx`
- componentes associados: `TarefaFormModal`, `IncidenciaGravacaoFormModal`, `RequisicoesTab`, `RecursosTab`

## Entregaveis

- backend para tarefas
- backend para incidencias de gravacao
- endpoints de leitura agregada para mapas e requisicoes
- frontend operacional de producao sem `supabase.from`
- smoke tests operacionais cobrindo criacao/edicao/renderizacao das telas centrais
- ajustes finais de estabilidade para permissao, contrato e navegacao

## Tarefas

1. Validar `Tarefas` com smoke de UI e corrigir regressao de criacao/edicao
2. Validar `Incidencias de Gravacao` em fluxo de tela e modal
3. Validar `Mapas` e `Requisicoes` em navegacao operacional real
4. Registrar no documento os pontos ja entregues e os remanescentes reais
5. Eliminar regressões de permissao/contrato encontradas durante os smokes

## Criterios de aceitacao

- [x] `Tarefas` roda 100% via backend
- [x] `Incidencias de Gravacao` roda 100% via backend
- [x] `Mapas` nao importa mais o cliente Supabase
- [x] consultas de planejamento e requisicoes usam somente a API local
- [x] smoke de UI operacional cobre `Tarefas`, `Incidencias`, `Mapas` e `Requisicoes`
- [x] regressões encontradas no fechamento operacional estao corrigidas

## Riscos

- consultas de mapa sao densas e cruzam varias tabelas
- pode exigir endpoints especializados em vez de CRUD puro
- os principais riscos agora sao de UX, permissao e seletor de interface, nao mais de dependencia do Supabase
