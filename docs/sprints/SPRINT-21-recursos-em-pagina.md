# SPRINT-21 Cadastros de Recursos

## Objetivo

Migrar os cadastros medios do modulo Recursos, incluindo os que tem abas com sub-registros.

Inventario e definicao de pronto: `docs/formularios-em-pagina-inventario.md`.

## Duracao sugerida

2 semanas

## Resultados esperados

- 7 telas de Recursos migradas
- abas de sub-registros funcionando dentro da pagina

## Escopo

- Departamentos, Equipes, Espacos, Figurinos, Fornecedores (Recursos e Eventos), Turnos, Recursos Fisicos

## Entregaveis

- 7 telas migradas
- abas Arquivos (Fornecedores) e Estoque (Recursos Fisicos) funcionando na pagina; os sub-registros continuam em modal

## Tarefas

1. Migrar `Departamento`, `Equipe`, `Espaco`, `Figurino`, `Turno`
2. Migrar `Fornecedor` com a aba Arquivos e as rotas em `/recursos/fornecedores` e `/eventos/fornecedores`
3. Migrar `RecursoFisico` com a aba Estoque
4. Adicionar `GET /:id` em `departamentos`, `equipes`, `espacos`, `figurinos`, `fornecedores`, `turnos`, `recursos-fisicos`
5. Ajustar `Turnos.test.tsx`, `TurnoFormModal.test.tsx` e `DepartamentoFormModal.test.tsx` ao novo fluxo

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
