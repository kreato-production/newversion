# Formularios em pagina - inventario e plano

## Contexto

Hoje as telas de cadastro abrem o formulario dentro de uma modal (`Dialog`). O modulo **Pessoas** foi o piloto da mudanca para formulario em pagina, seguindo o App Router do Next.js:

- `/<modulo>/<cadastro>` - lista
- `/<modulo>/<cadastro>/novo` - inclusao
- `/<modulo>/<cadastro>/[id]` - edicao / consulta

Referencia de implementacao (piloto):

- `src/views/recursos/PessoaForm.tsx` - formulario em pagina
- `src/app/(app)/recursos/pessoas/novo/page.tsx` e `[id]/page.tsx` - rotas
- `src/modules/pessoas/pessoas.navigation.ts` - rota base + chave da navegacao anterior/proximo
- `backend/src/modules/pessoas/routes/index.ts` - `GET /pessoas/:id` (404 / 403 por tenant)

Este documento lista as telas que abriam por modal e as distribui nas sprints 18 a 25. **Iniciativa concluida na SPRINT-25**: todas as telas de cadastro principais abrem como pagina; as modais restantes sao as da secao "Fora do escopo" e os consumidores embutidos documentados em "Pontos de atencao".

## Padrao a aplicar em cada tela (definicao de pronto)

1. Rotas `novo/page.tsx` e `[id]/page.tsx` criadas ao lado da `page.tsx` da lista.
2. Formulario renderizado com o layout padrao (`FormPage`) e o estado em `useRecordForm`, ambos criados na SPRINT-18: `PageHeader`, barra de acoes (Voltar, anterior/proximo, Cancelar, Salvar) e conteudo em `Card`.
3. A lista navega com `router.push` em vez de abrir a modal e grava a ordem filtrada para a navegacao anterior/proximo.
4. Backend expoe `GET /<recurso>/:id` com `requireTenantAccess`, 404 quando nao existe e 403 fora do tenant, com teste de rota usando repositorio em memoria.
5. Permissoes: sem `alterar`, a edicao abre somente leitura; sem `incluir`, o botao Novo nao aparece.
6. A modal antiga e removida quando nao houver outro consumidor.
7. `tsc`, `lint` e testes de frontend e backend passando.

## Fora do escopo (continuam como modal)

Estas modais nao sao telas de cadastro principal. Sao acoes, relatorios, graficos ou sub-registros editados dentro de outro formulario, e devem continuar como modal:

| Componente                                                                     | Motivo                                              |
| ------------------------------------------------------------------------------ | --------------------------------------------------- |
| `admin/ExecResultDialog`                                                       | resultado de execucao do Maestro                    |
| `recursos/MapaEscalasModal`, `MapaOciosidadeModal`, `MapaRecursosFisicosModal` | mapas / visualizacoes                               |
| `producao/IncidenciaChartModal`                                                | grafico                                             |
| `satops/JanelaRelatorioModal`                                                  | relatorio                                           |
| `satops/JanelaResponsaveisModal`, `SateliteResponsaveisModal`                  | selecao de responsaveis                             |
| `producao/GrelhaPlanearModal`, `GrelhaTemplateAplicarModal`                    | acoes de planeamento na grelha                      |
| `producao/PlanoProducaoModal`                                                  | visualizacao do plano de producao                   |
| Detalhe de item em `views/producao/GrelhaProgramacao`                          | detalhe rapido na grelha                            |
| `recursos/EstoqueTab` (item de estoque)                                        | sub-registro dentro do formulario de Recurso Fisico |
| `producao/ConteudoEspacosTab`, `GravacaoEspacosTab` (espaco)                   | sub-registro dentro do formulario                   |
| `producao/RequisicoesTab` (associar item de estoque)                           | acao de associacao                                  |
| `recursos/FornecedorArquivosTab` (preview)                                     | pre-visualizacao de arquivo                         |

## Inventario das telas de cadastro em modal

Legenda de complexidade, pelo tamanho do formulario e dependencias: **P** (pequena, ate ~250 linhas), **M** (media, 250-600), **G** (grande, mais de 600 ou com abas e sub-registros).

### Recursos

| Tela                      | Rota                                                       | Modal atual                                | Compl. | Sprint                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------ | ------ | ---------------------- |
| Pessoas                   | `/recursos/pessoas`                                        | ~~PessoaFormModal~~                        | M      | **concluida (piloto)** |
| Cargos                    | `/recursos/cargos`                                         | ParametroFormModal (generica)              | P      | 19 - concluida         |
| Categoria de Fornecedores | `/recursos/categoria-fornecedores`                         | ParametroFormModal                         | P      | 19 - concluida         |
| Classificacao de Pessoas  | `/recursos/classificacao-pessoas`                          | ParametroFormModal                         | P      | 19 - concluida         |
| Funcoes                   | `/recursos/funcoes`                                        | ParametroFormModal                         | P      | 19 - concluida         |
| Material                  | `/recursos/material`                                       | ParametroFormModal                         | P      | 19 - concluida         |
| Servicos                  | `/recursos/servicos` e `/eventos/parametrizacoes/servicos` | ParametroFormModal                         | P      | 19 - concluida         |
| Tipo de Figurino          | `/recursos/tipo-figurino`                                  | ParametroFormModal                         | P      | 19 - concluida         |
| Feriados                  | `/recursos/feriados`                                       | FeriadoFormModal (180)                     | P      | 20 - concluida         |
| Recursos Tecnicos         | `/recursos/tecnicos`                                       | RecursoTecnicoFormModal (184)              | P      | 20 - concluida         |
| Departamentos             | `/recursos/departamentos`                                  | DepartamentoFormModal (459)                | M      | 21 - concluida         |
| Equipes                   | `/recursos/equipes`                                        | EquipeFormModal (424)                      | M      | 21 - concluida         |
| Espacos                   | `/recursos/espacos`                                        | EspacoFormModal (412)                      | M      | 21 - concluida         |
| Figurinos                 | `/recursos/figurinos`                                      | FigurinoFormModal (346)                    | M      | 21 - concluida         |
| Fornecedores              | `/recursos/fornecedores` e `/eventos/fornecedores`         | FornecedorFormModal (282) + aba Arquivos   | M      | 21 - concluida         |
| Turnos                    | `/recursos/turnos`                                         | TurnoFormModal (463)                       | M      | 21 - concluida         |
| Recursos Fisicos          | `/recursos/fisicos`                                        | RecursoFisicoFormModal (505) + aba Estoque | M      | 21 - concluida         |
| Recursos Humanos          | `/recursos/humanos`                                        | RecursoHumanoFormModal (967)               | G      | 24 - concluida         |
| Escalas                   | `/recursos/escalas`                                        | EscalaFormModal (943)                      | G      | 24 - concluida         |

### Producao

| Tela                      | Rota                               | Modal atual                                                         | Compl. | Sprint         |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------- | ------ | -------------- |
| Classificacao             | `/producao/classificacao`          | ParametroFormModal                                                  | P      | 19 - concluida |
| Tipos de Gravacao         | `/producao/tipos-gravacao`         | ParametroFormModal                                                  | P      | 19 - concluida |
| Status de Gravacao        | `/producao/status`                 | StatusGravacaoFormModal (176)                                       | P      | 20 - concluida |
| Status de Planeamento     | `/producao/status-planeamento`     | StatusPlaneamentoFormModal (178)                                    | P      | 20 - concluida |
| Status de Tarefa          | `/producao/status-tarefa`          | Dialog inline na view                                               | P      | 20 - concluida |
| Severidades de Incidencia | `/producao/severidades-incidencia` | SeveridadeIncidenciaFormModal (193)                                 | P      | 20 - concluida |
| Impactos de Incidencia    | `/producao/impactos-incidencia`    | ImpactoIncidenciaFormModal (175)                                    | P      | 20 - concluida |
| Categorias de Incidencia  | `/producao/categorias-incidencia`  | CategoriaIncidenciaFormModal (407)                                  | M      | 20 - concluida |
| Programas                 | `/producao/programas`              | ProgramaFormModal (279)                                             | M      | 23 - concluida |
| Templates                 | `/producao/templates`              | TemplateFormModal (216)                                             | P      | 23 - concluida |
| Tabelas de Preco          | `/producao/tabelas-preco`          | TabelaPrecoFormModal (356)                                          | M      | 23 - concluida |
| Tarefas                   | `/producao/tarefas`                | TarefaFormModal (533)                                               | M      | 23 - concluida |
| Incidencias               | `/producao/incidencias`            | IncidenciaGravacaoFormModal (666)                                   | G      | 23 - concluida |
| Conteudo                  | `/producao/conteudo`               | ConteudoBackendFormModal (1009) + abas                              | G      | 25 - concluida |
| Gravacao                  | `/producao/gravacao`               | GravacaoBackendFormModal (566) + RecursosTab (1498) + Espacos (956) | G      | 25 - concluida |

### Eventos

| Tela              | Rota                                      | Modal atual              | Compl. | Sprint         |
| ----------------- | ----------------------------------------- | ------------------------ | ------ | -------------- |
| Tipo de Evento    | `/eventos/parametrizacoes/tipo-evento`    | ParametroFormModal       | P      | 19 - concluida |
| Tipo de Expositor | `/eventos/parametrizacoes/tipo-expositor` | ParametroFormModal       | P      | 19 - concluida |
| Expositores       | `/eventos/expositores`                    | ExpositorFormModal (558) | M      | 24 - concluida |
| Eventos           | `/eventos`                                | EventoFormModal (821)    | G      | 24 - concluida |

### Financeiro

| Tela                     | Rota                              | Modal atual                     | Compl. | Sprint         |
| ------------------------ | --------------------------------- | ------------------------------- | ------ | -------------- |
| Categorias de Despesa    | `/financeiro/categorias-despesa`  | CategoriaDespesaFormModal (187) | P      | 19 - concluida |
| Formas de Pagamento      | `/financeiro/formas-pagamento`    | FormaPagamentoFormModal (215)   | P      | 19 - concluida |
| Status de Contas a Pagar | `/financeiro/status-contas-pagar` | StatusContaPagarFormModal (238) | P      | 19 - concluida |
| Tipos de Documentos      | `/financeiro/tipos-documentos`    | TipoDocumentoFormModal (185)    | P      | 19 - concluida |
| Tipos de Pagamento       | `/financeiro/tipos-pagamento`     | TipoPagamentoFormModal (185)    | P      | 19 - concluida |
| Contas a Pagar           | `/financeiro/contas-a-pagar`      | ContaPagarFormModal (391)       | M      | 22 - concluida |
| Orcamento                | `/financeiro/orcamento`           | Dialog inline na view (1248)    | G      | 22 - concluida |

### SatOps

| Tela              | Rota                     | Modal atual                 | Compl. | Sprint         |
| ----------------- | ------------------------ | --------------------------- | ------ | -------------- |
| Estados de Evento | `/satops/estados-evento` | EstadoEventoFormModal (185) | P      | 20 - concluida |
| Alertas           | `/satops/alertas`        | AlertaFormModal (217)       | P      | 20 - concluida |
| Satelites         | `/satops/satelites`      | SateliteFormModal (308)     | M      | 24 - concluida |
| Janelas           | `/satops/janelas`        | JanelaFormModal (983)       | G      | 24 - concluida |

### Administracao e Global

| Tela                | Rota                   | Modal atual                      | Compl. | Sprint         |
| ------------------- | ---------------------- | -------------------------------- | ------ | -------------- |
| Perfis de Acesso    | `/admin/perfis`        | PerfilFormModal (169)            | P      | 22 - concluida |
| Unidades de Negocio | `/admin/unidades`      | UnidadeNegocioFormModal (342)    | M      | 22 - concluida |
| Centros de Lucro    | `/admin/centros-lucro` | CentroLucroFormModal (388)       | M      | 22 - concluida |
| Usuarios            | `/admin/usuarios`      | UsuarioFormModal (548)           | M      | 22 - concluida |
| Usuarios Globais    | `/global/usuarios`     | UsuarioFormModal (compartilhada) | M      | 22 - concluida |
| Tenants             | `/global/tenants`      | TenantFormModal (377)            | M      | 22 - concluida |
| Maestro             | `/admin/maestro`       | MaestroFormModal (698)           | G      | 22 - concluida |

## Resumo

| Sprint    | Tema                                                              | Telas                            |
| --------- | ----------------------------------------------------------------- | -------------------------------- |
| 18        | Fundacao: layout `FormPage`, hook de navegacao, refatorar Pessoas | 0 (base) - **concluida**         |
| 19        | Parametrizacoes genericas + parametros financeiros                | 16 - **concluida**               |
| 20        | Status, incidencias e parametros simples                          | 10 - **concluida**               |
| 21        | Recursos (cadastros medios)                                       | 7 - **concluida**                |
| 22        | Administracao e Financeiro                                        | 9 - **concluida**                |
| 23        | Producao operacional                                              | 5 - **concluida**                |
| 24        | Cadastros complexos (RH, Escalas, Eventos, SatOps)                | 6 - **concluida**                |
| 25        | Nucleo de producao (Conteudo e Gravacao) + fechamento             | 2 - **concluida**                |
| **Total** |                                                                   | **55** (+ Pessoas, ja concluida) |

## Pontos de atencao

- **Parametrizacoes genericas (SPRINT-19)**: a configuracao das 11 telas fica em `src/modules/parametros/parametros.config.ts`; as rotas `novo`/`[id]` usam `ParametroFormRoute`, que deduz a lista de origem pela URL (Servicos funciona em Recursos e em Eventos). Os 5 parametros financeiros usam `TituloFormPage` com configuracoes em `src/modules/parametrizacoes/financeiro.forms.ts`.
- **Formulario generico de parametros (SPRINT-20)**: `TituloFormPage` (`src/components/shared/TituloFormPage.tsx`) atende status, severidades, impactos, categorias, estados de evento e os parametros financeiros. As opcoes (rotulos, codigo obrigatorio, cor, descricao, traducao, flags, abas extras) ficam em configs: `src/modules/parametrizacoes/{financeiro,producao}.forms`, `src/modules/satops/estados-evento.form.ts`. Feriados, Recursos Tecnicos e Alertas tem formulario proprio em `src/views`.
- **Formularios complexos (SPRINT-21)**: telas com sub-listas, calculos ou validacoes proprias usam `RecordFormPage` (`src/components/shared/RecordFormPage.tsx`), que carrega, salva, aplica permissao e navega; os campos ficam num `XxxFormBody` (ex.: `src/components/recursos/TurnoFormBody.tsx`) que guarda o proprio estado, inicializado do registro carregado. Os bodies foram obtidos removendo Dialog e rodape dos modais antigos, preservando a logica testada. Atencao: se o `<form>` estiver dentro de uma aba, use `forceMount` nessa aba (ver `FornecedorFormBody`), senao o Salvar da pagina nao encontra o formulario quando outra aba esta aberta.
- **Texto corrompido (mojibake) em 8 arquivos**: `ConteudoBackendFormModal`, `ConteudoRecursosTab`, `ConteudoTerceirosTab`, `GravacaoTarefasTab` e `Mapas` tem strings como "ProduÃ§Ã£o". Alem do texto quebrado na tela, caminhos de permissao assim nunca casam. Corrigido em Status de Tarefa e Impactos de Incidencia (SPRINT-20), Contas a Pagar (SPRINT-22), Tarefas (SPRINT-23) e nos demais na SPRINT-25 (Conteudo, ConteudoRecursosTab, ConteudoTerceirosTab, GravacaoTarefasTab, Mapas). Nos caminhos de permissao do Conteudo a correcao e so cosmetica: `normalizePermissionKey` ja decodificava o mojibake. Em Tarefas a correcao ativou as permissoes por campo (Titulo, Status, Responsavel...), que antes nunca casavam.
- **Administracao e Financeiro (SPRINT-22)**: Usuarios e Usuarios Globais usam o mesmo `UsuarioFormBody` com paginas distintas (`UsuarioForm` / `GlobalUsuarioForm`); a pagina global continua forcando `role: GLOBAL_ADMIN`. `UnidadeNegocioFormModal` virou um wrapper do `UnidadeNegocioFormBody`, mantido so para Tenant > Unidades. O Orcamento foi dividido: `OrcamentoFormBody` (cabecalho) + `OrcamentoItensPanel` (itens por categoria, antes um dialogo de detalhe).
- **Itens do Orcamento sem somente leitura**: as linhas de itens (`ItemRow` / `NewItemRow` em `OrcamentoItensPanel`) salvam sozinhas e nao respeitam `readOnly` — ja era assim no dialogo antigo. No backend, as rotas `/orcamento/:id/itens` checam so o tenant (sem `alterar`), ao contrario de `POST/PUT /orcamento`; tratar junto com o item abaixo.
- **Producao operacional (SPRINT-23)**: `IncidenciaGravacaoFormModal` virou um wrapper do `IncidenciaGravacaoFormBody` com as mesmas props de antes, mantido para Gravacao > Incidencias, SatOps Janela e Dashboard Operacional (esses consumidores nao mudaram). A exclusao de Tarefa passou para a pagina (`TarefaForm`), com confirmacao.
- **Cadastros complexos (SPRINT-24)**: Recursos Humanos tem o `<form>` na aba "Dados" (com `forceMount`); as abas Ausencias e Escalas tinham botoes Salvar proprios, agora e o Salvar da pagina. O Mapa de Escalas da lista continua salvando o colaborador pela propria lista (`handleMapaUpdate`). Em Escalas, ao editar, a grade de colaboradores e salva antes da escala (se falhar, a escala nao e salva); `ESCALAS_PERMISSION_SCOPE` passou para `src/modules/escalas/escalas.navigation.ts`. Em Eventos o botao "Imprimir PDF" ficou no topo do formulario (imprime o estado atual, mesmo sem salvar). Na Janela, o cadastro de incidencias continua num dialogo sobre a pagina.
- **Nucleo de producao (SPRINT-25)**: `GravacaoBackendFormModal` virou um wrapper do `GravacaoFormBody` com as mesmas props (sem `navigation`), mantido para a Grelha de programacao (`GrelhaPlanearModal` planeja com `initialValues`; `GrelhaProgramacao` abre a gravacao da grade). Os wrappers mortos `ConteudoFormModal` e `GravacaoFormModal` foram removidos. Botoes que ficavam no cabecalho/rodape das modais passaram para o topo do formulario: "Plano de Producao" (Conteudo) e o gerador de relatorio (Gravacao). Nova gravacao passa a iniciar com o status "Planejada" quando ele existe (antes a lista de status ainda nao estava carregada ao abrir a modal e o valor ficava vazio). `GET /conteudos/:id` aplica a mesma restricao por unidade de negocio da lista (fora das unidades do usuario: 404).
- **Varredura final (SPRINT-25)**: os unicos `XxxFormModal` restantes sao `UnidadeNegocioFormModal` (Tenant > Unidades), `IncidenciaGravacaoFormModal` (Gravacao > Incidencias, SatOps Janela, Dashboard Operacional) e `GravacaoBackendFormModal` (Grelha). Os demais `<Dialog>` sao acoes auxiliares (mapas, relatorios, pickers, responsaveis, plano de producao) ou sub-registros dentro de formularios.
- **Formularios (configuracao de campos, apos a SPRINT-25)**: o dialogo de campos de `views/admin/Formularios`, antes listado como fora do escopo, tambem virou pagina: `/admin/formularios/[id]` (`FormularioForm` + `FormularioCamposFormBody`), onde o id e o do formulario no `formsRegistry`. Nao ha `/novo` (os formularios sao fixos no codigo). O GLOBAL_ADMIN escolhe o tenant na lista; a escolha fica no sessionStorage (`readFormulariosTenant` em `src/modules/admin/formularios.navigation.ts`), a pagina mostra o tenant na descricao e, aberta sem tenant, pede para escolher na lista. O breadcrumb mostra o nome do formulario em vez do id. A pagina tem os tabuladores **Campos** (validacao, tamanho e posicao) e **Preview** (grade de 12 colunas com quadriculado de apoio, calculada em `src/components/admin/formularioLayout.ts` como a grade CSS do formulario real). As alteracoes ficam em rascunho: "Publicar alteracoes" (no Preview, ativo so com alteracoes pendentes) grava e continua na pagina, e nao ha Salvar na barra; "Voltar ao padrao" pede confirmacao e so tem efeito depois de publicar. O tamanho padrao de cada campo e a ordem padrao ficam no `formsRegistry` (`tamanhoPadrao`, `getFormLayoutDefaults`), usados pelo preview e pelo `ProgramaFormBody`. A grade tem 12 colunas (`.configurable-field-grid` em `src/app/globals.css`, a folha global carregada por `src/app/layout.tsx`; `src/index.css` e legado e nao e carregado; uma coluna no celular) e o Tamanho aceita 25%, 33%, 50%, 67%, 75% e 100% (`TAMANHO_OPTIONS`; os valores antigos 1-4 continuam sendo quartos). O formulario usa `ConfigurableFieldGrid` + `fieldLayout(campo)` de `useFormFieldConfig`, e o preview desenha a mesma grade, entao os dois nao divergem. Todos os 15 formularios do registro estao convertidos (`layoutConfiguravel: true`): ordem e `tamanhoPadrao` reproduzem a disposicao anterior de cada tela; as fotos da Pessoa e do Recurso Humano sao a `areaLateral` fixa. Campos numa secao ou tabulador proprio tem `grupo` no registro (Frequencia Semanal do Conteudo, Moeda no tabulador Preferencias da Unidade de Negocio): ficam na grade da secao, a posicao so os reordena dentro dela, e o preview mostra o grupo com titulo e nao deixa arrastar um campo para outro grupo. Campos que estavam fora do registro entraram nele (Codigo da Gravacao, Hora Inicio/Fim da Tarefa, Anexos do Recurso Humano); Recursos Tecnicos/Fisicos sairam do Conteudo (nao sao campos do formulario). Espacamento: 10px entre linhas e 6px entre rotulo e campo em todo formulario em pagina (regras `.form-page-content` em `src/app/globals.css`, no `CardContent` do `FormPage`; a `.configurable-field-grid` ja usa `gap: 0.625rem 1rem`). No Preview os campos podem ser arrastados (antes/depois de outro campo, ou para o fim numa area vazia) e redimensionados pela alca da borda direita, encaixando nos tamanhos permitidos; pelo teclado, setas movem e Shift + seta redimensiona. Isso altera o mesmo rascunho do tabulador Campos (Tamanho/Posicao), publicado pelo botao Publicar. A coluna Posicao sempre mostra a ordem efetiva de todos os campos (1..n, `withEffectivePositions`); digitar uma posicao move o campo como o arrastar, e o Publicar grava a posicao de todos. Tamanho igual ao padrao fica em branco, e so conta como alteracao o valor efetivo que muda (`moveCampo` / `resizeCampo` em `formularioLayout.ts`). Tabulador **Lista**: a lista do modulo zebrada ou nao e, se zebrada, a cor pastel das linhas intercaladas (paleta `LIST_STRIPE_COLORS` em `src/data/listStripeColors.ts`; grava-se a chave da cor). Fica na tabela `formulario_lista` (tenant, formulario, zebrado, cor_zebra), criada pelo backend no primeiro acesso, e vem em `lista` no GET/PUT de `/admin-config/formularios/:id/campos`; publicada pelo mesmo Publicar. As listas usam `useFormListStyle(formularioId)` e passam `stripeColor` ao `SortableTable` (ou `zebraBodyProps` num `TableBody` proprio); `FORMS_WITH_LIST_STYLE` lista os formularios ja ligados. Tabulador **Traducao**: matriz campos x idiomas do sistema (`languageLabels`), com a coluna Padrao (rotulo do `formsRegistry`) somente leitura; grava em `formulario_campos.traducoes` (jsonb, so os preenchidos) pelo mesmo Publicar. Nos formularios, o rotulo vem de `fieldLabel(campo, rotuloAtual)` de `useFormFieldConfig`: a traducao do idioma atual, senao o rotulo que o formulario ja mostrava; a mensagem de obrigatorio usa o mesmo rotulo. "Voltar ao padrao" nao apaga traducoes. Para converter um formulario: ordem e `tamanhoPadrao` no registro reproduzindo a disposicao atual, todos os campos (inclusive os que nao estavam no registro) num unico `ConfigurableFieldGrid`.
- **Armadilha do Select (Radix)**: se o valor de um `<Select>` for alterado por codigo depois da montagem enquanto as opcoes ainda carregam, o Radix emite `onValueChange('')` e apaga o valor. Aconteceu com o status inicial da Tarefa (corrigido ignorando `''` no `onValueChange`). Nos demais formularios o valor vem do registro na montagem e nao muda depois, entao nao ha risco.
- **Permissoes nao aplicadas no backend**: as rotas `/parametros/:storageKey` nao verificam incluir/alterar/excluir (apenas tenant), e os parametros financeiros nao tem caminho de permissao no frontend (o backend exige TENANT_ADMIN). Mantido como estava; tratar a parte.

- **Backend `GET /:id`**: so existe hoje em `gravacoes`, `grelha-programacao`, `maestro`, `orcamento` e `pessoas`. Todos os outros modulos precisam do endpoint, e cada sprint inclui esse trabalho.
- **Modais com mais de um consumidor**: `UsuarioFormModal` (Usuarios e Usuarios Globais), `UnidadeNegocioFormModal` (tambem usada em `TenantUnidadesTab`), `IncidenciaGravacaoFormModal` (tambem aberta dentro de Gravacao, Janela e Dashboard Operacional) e `GravacaoBackendFormModal` (tambem aberta pela Grelha). Nesses casos o formulario e extraido para um componente reutilizavel: a tela principal passa a usar a pagina e os contextos embutidos continuam com a modal, ate decisao contraria.
- **Rotas duplicadas**: Servicos e Fornecedores aparecem em Recursos e em Eventos. As rotas `novo` e `[id]` devem existir nos dois caminhos, e o Voltar deve retornar a lista de origem.
- **Breadcrumb**: `AppBreadcrumb` ja trata `novo` e ids (UUID -> "Detalhe"). Ids que nao sejam UUID precisam ser revisados.
