# SPRINT-25 Conteudo, Gravacao e fechamento

## Objetivo

Migrar os dois formularios centrais da Producao e encerrar a iniciativa.

Inventario e definicao de pronto: `docs/formularios-em-pagina-inventario.md`.

## Duracao sugerida

2 semanas

## Resultados esperados

- Conteudo e Gravacao em pagina
- nenhuma tela de cadastro principal abrindo em modal

## Escopo

- Producao: Conteudo, Gravacao
- Fechamento: revisao geral e limpeza

## Entregaveis

- 2 telas migradas
- wrappers `ConteudoFormModal` e `GravacaoFormModal` removidos
- inventario atualizado com todas as telas concluidas

## Tarefas

1. Migrar `ConteudoBackendFormModal` (1009 linhas, abas de espacos e plano de producao)
2. Migrar `GravacaoBackendFormModal` com `RecursosTab` (1498 linhas) e `GravacaoEspacosTab`; a Grelha (`GrelhaPlanearModal`) continua abrindo a modal sobre o mesmo componente
3. Reaproveitar `GET /gravacoes/:id` e criar o de conteudo
4. Remover os wrappers e o codigo morto
5. Varredura final: procurar `FormModal` e `<Dialog` em telas de cadastro
6. Atualizar `docs/formularios-em-pagina-inventario.md`

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
