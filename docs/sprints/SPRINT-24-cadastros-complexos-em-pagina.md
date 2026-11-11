# SPRINT-24 Cadastros complexos

## Objetivo

Migrar os formularios grandes, com muitas secoes, regras e abas.

Inventario e definicao de pronto: `docs/formularios-em-pagina-inventario.md`.

## Duracao sugerida

2 semanas

## Resultados esperados

- 6 telas grandes migradas

## Escopo

- Recursos: Recursos Humanos, Escalas
- Eventos: Eventos, Expositores
- SatOps: Satelites, Janelas

## Entregaveis

- 6 telas migradas
- os mapas (`MapaEscalasModal`, `MapaOciosidadeModal`) e as modais de responsaveis continuam como modal

## Tarefas

1. Migrar `RecursoHumano` (967 linhas), aproveitando a pagina para organizar as secoes
2. Migrar `Escala` (943 linhas), mantendo o mapa mensal como modal
3. Migrar `Evento` (orcamento, agenda e timeline de preview) e `Expositor`
4. Migrar `Satelite` e `Janela` (o relatorio e os responsaveis continuam modal)
5. Adicionar `GET /:id` em `recursos-humanos`, `escalas`, `gestao-eventos`, `satops`

## Criterios de aceite

- todas as telas do escopo abrem em `/novo` e `/[id]`, sem modal
- `GET /<recurso>/:id` com 404 (inexistente) e 403 (outro tenant) coberto por teste de rota
- navegacao anterior/proximo respeitando a ordem filtrada da lista
- edicao em somente leitura para quem nao tem permissao de alterar
- modais antigas removidas (ou mantidas apenas para os consumidores embutidos documentados)
- `tsc`, `lint` e testes de frontend e backend passando
- validacao manual de cada tela: incluir, alterar, consultar sem permissao, voltar e anterior/proximo
- testes do escopo da sprint criados
- testes executados ao final da sprint
