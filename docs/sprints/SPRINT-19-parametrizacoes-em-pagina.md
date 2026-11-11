# SPRINT-19 Parametrizacoes genericas e parametros financeiros

## Objetivo

Migrar as parametrizacoes. A maior parte usa o `ParametroListPage`/`ParametroFormModal` generico, entao uma unica mudanca cobre 11 telas.

Inventario e definicao de pronto: `docs/formularios-em-pagina-inventario.md`.

## Duracao sugerida

1 semana

## Resultados esperados

- `ParametroListPage` com formulario em pagina (`ParametroFormPage`)
- 11 parametrizacoes genericas migradas
- 5 parametros financeiros migrados

## Escopo

- Genericas (`ParametroListPage`): Cargos, Categoria de Fornecedores, Classificacao de Pessoas, Funcoes, Material, Servicos (Recursos e Eventos), Tipo de Figurino, Classificacao, Tipos de Gravacao, Tipo de Evento, Tipo de Expositor
- Financeiro: Categorias de Despesa, Formas de Pagamento, Status de Contas a Pagar, Tipos de Documentos, Tipos de Pagamento

## Entregaveis

- 16 telas migradas
- `ParametroFormModal` removido

## Tarefas

1. Criar `ParametroFormPage` generico sobre `FormPage`, recebendo a mesma configuracao do `ParametroListPage`
2. Criar as rotas `novo` e `[id]` para as 11 parametrizacoes (incluindo `/eventos/parametrizacoes/servicos`)
3. Adicionar `GET /:id` aos modulos de backend das parametrizacoes (`parametros`, `parametrizacoes`)
4. Migrar os 5 cadastros financeiros (`CategoriaDespesa`, `FormaPagamento`, `StatusContaPagar`, `TipoDocumento`, `TipoPagamento`) e adicionar `GET /:id` no backend correspondente
5. Garantir que o Voltar de Servicos retorne a lista de origem (Recursos ou Eventos)

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
