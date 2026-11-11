# SPRINT-20 Status, incidencias e parametros simples

## Objetivo

Migrar os cadastros pequenos com modal dedicada, consolidando o padrao em telas de baixo risco.

Inventario e definicao de pronto: `docs/formularios-em-pagina-inventario.md`.

## Duracao sugerida

1 semana

## Resultados esperados

- 10 telas pequenas migradas

## Escopo

- Producao: Status de Gravacao, Status de Planeamento, Status de Tarefa (dialog inline na view), Severidades de Incidencia, Impactos de Incidencia, Categorias de Incidencia
- Recursos: Feriados, Recursos Tecnicos
- SatOps: Estados de Evento, Alertas

## Entregaveis

- 10 telas migradas
- modais dedicadas removidas

## Tarefas

1. Extrair o formulario inline de `views/producao/StatusTarefa.tsx` para uma pagina
2. Migrar `StatusGravacao`, `StatusPlaneamento`, `SeveridadeIncidencia`, `ImpactoIncidencia`, `CategoriaIncidencia`
3. Migrar `Feriado`, `RecursoTecnico`, `EstadoEvento`, `Alerta`
4. Adicionar `GET /:id` nos modulos `incidencias-gravacao`, `feriados`, `recursos-tecnicos`, `satops` e de status

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
