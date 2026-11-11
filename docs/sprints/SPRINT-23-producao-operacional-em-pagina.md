# SPRINT-23 Producao operacional

## Objetivo

Migrar os cadastros operacionais de Producao.

Inventario e definicao de pronto: `docs/formularios-em-pagina-inventario.md`.

## Duracao sugerida

1 semana

## Resultados esperados

- 5 telas migradas
- formulario de incidencia reutilizavel entre a pagina e os contextos embutidos

## Escopo

- Programas, Templates, Tabelas de Preco, Tarefas, Incidencias

## Entregaveis

- 5 telas migradas
- `IncidenciaGravacaoFormModal` mantida apenas para Gravacao, Janela e Dashboard Operacional, sobre o mesmo componente

## Tarefas

1. Migrar `Programa`, `Template` (o `PlanoProducaoModal` continua modal), `TabelaPreco`, `Tarefa`
2. Extrair o formulario de incidencia; `/producao/incidencias` passa a usar a pagina
3. Ajustar `ProgramaFormModal.test.tsx` ao novo fluxo
4. Adicionar `GET /:id` em `programas`, `tarefas`, `incidencias-gravacao` e templates / tabelas de preco

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
