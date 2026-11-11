// Registry of all system forms and their fields
// Used by the "Formulários" admin module to configure field validation and layout

/** Colunas da grade dos formulários configuráveis (e do preview em Formulários). */
export const FORM_GRID_COLUMNS = 12;

/**
 * Largura de um campo. '1'-'4' são quartos (valores já gravados antes dos terços);
 * '1/3' e '2/3' são terços.
 */
export type TamanhoCampo = '1' | '2' | '3' | '4' | '1/3' | '2/3';

/** Opções do "Tamanho", com as colunas que ocupam na grade de 12. */
export const TAMANHO_OPTIONS: { value: TamanhoCampo; label: string; span: number }[] = [
  { value: '1', label: '25% (1/4)', span: 3 },
  { value: '1/3', label: '33% (1/3)', span: 4 },
  { value: '2', label: '50% (1/2)', span: 6 },
  { value: '2/3', label: '67% (2/3)', span: 8 },
  { value: '3', label: '75% (3/4)', span: 9 },
  { value: '4', label: '100%', span: 12 },
];

/** Colunas (de 12) de um tamanho gravado; null quando vazio ou desconhecido. */
export function tamanhoToSpan(tamanho: string | null | undefined): number | null {
  return TAMANHO_OPTIONS.find((option) => option.value === tamanho)?.span ?? null;
}

export interface FormFieldDefinition {
  campo: string;
  label: string;
  /** Largura quando o tamanho não foi configurado. Padrão: 100%. */
  tamanhoPadrao?: TamanhoCampo;
  /**
   * Seção própria do formulário (ex.: "Frequência Semanal", ou um tabulador): o campo fica na
   * grade dessa seção, e a posição só o reordena dentro dela. Sem grupo: a área principal.
   */
  grupo?: string;
}

export interface FormDefinition {
  id: string;
  nome: string;
  modulo: string;
  /**
   * O formulário do módulo aplica o Tamanho e a Posição configurados (grade de 12 colunas).
   * Nos demais, só a validação (obrigatório / sugerido) é aplicada.
   */
  layoutConfiguravel?: boolean;
  /** Área fixa à esquerda dos campos (ex.: a foto da Pessoa), mostrada no preview. */
  areaLateral?: string;
  /** Campos na ordem em que aparecem no formulário (é a posição padrão de cada um). */
  campos: FormFieldDefinition[];
}

export const formsRegistry: FormDefinition[] = [
  {
    id: 'programa',
    nome: 'Programa',
    modulo: 'Produção',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '1' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '2' },
      { campo: 'cor', label: 'Cor', tamanhoPadrao: '4' },
      { campo: 'unidadeNegocio', label: 'Unidade de Negócio', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'conteudo',
    nome: 'Conteúdo',
    modulo: 'Produção',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '1/3' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '1/3' },
      { campo: 'quantidadeEpisodios', label: 'Qtd. Episódios', tamanhoPadrao: '1/3' },
      { campo: 'unidadeNegocio', label: 'Unidade de Negócio', tamanhoPadrao: '1/3' },
      { campo: 'centroLucro', label: 'Centro de Custos', tamanhoPadrao: '1/3' },
      { campo: 'tabelaPrecoId', label: 'Tabela de Preço', tamanhoPadrao: '1/3' },
      { campo: 'programaId', label: 'Programa', tamanhoPadrao: '1' },
      { campo: 'tipoConteudo', label: 'Tipo de Conteúdo', tamanhoPadrao: '1' },
      { campo: 'classificacao', label: 'Classificação', tamanhoPadrao: '1' },
      { campo: 'anoProducao', label: 'Ano de Produção', tamanhoPadrao: '1' },
      { campo: 'sinopse', label: 'Sinopse', tamanhoPadrao: '2' },
      { campo: 'orcamento', label: 'Orçamento', tamanhoPadrao: '2' },
      {
        campo: 'frequenciaDataInicio',
        label: 'Frequência - Data Início',
        tamanhoPadrao: '1/3',
        grupo: 'Frequência Semanal',
      },
      {
        campo: 'frequenciaDataFim',
        label: 'Frequência - Data Fim',
        tamanhoPadrao: '1/3',
        grupo: 'Frequência Semanal',
      },
      {
        campo: 'frequenciaDiasSemana',
        label: 'Frequência - Dias da Semana',
        tamanhoPadrao: '1/3',
        grupo: 'Frequência Semanal',
      },
    ],
  },
  {
    id: 'gravacao',
    nome: 'Gravação',
    modulo: 'Produção',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigo', label: 'Código', tamanhoPadrao: '1/3' },
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '1/3' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '1/3' },
      { campo: 'unidadeNegocio', label: 'Unidade de Negócio', tamanhoPadrao: '1' },
      { campo: 'centroLucro', label: 'Centro de Custos', tamanhoPadrao: '1' },
      { campo: 'programaId', label: 'Programa', tamanhoPadrao: '1' },
      { campo: 'tipoConteudo', label: 'Tipo de Conteúdo', tamanhoPadrao: '1' },
      { campo: 'classificacao', label: 'Classificação', tamanhoPadrao: '1' },
      { campo: 'status', label: 'Status', tamanhoPadrao: '1' },
      { campo: 'conteudoId', label: 'Conteúdo', tamanhoPadrao: '1' },
      { campo: 'dataPrevista', label: 'Data Prevista', tamanhoPadrao: '1' },
      { campo: 'orcamento', label: 'Orçamento', tamanhoPadrao: '2' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '2' },
    ],
  },
  {
    id: 'tarefa',
    nome: 'Tarefa',
    modulo: 'Produção',
    layoutConfiguravel: true,
    campos: [
      { campo: 'titulo', label: 'Título da Tarefa', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
      { campo: 'gravacaoId', label: 'Gravação', tamanhoPadrao: '2' },
      { campo: 'statusId', label: 'Status', tamanhoPadrao: '2' },
      { campo: 'recursoHumanoId', label: 'Responsável', tamanhoPadrao: '2' },
      { campo: 'prioridade', label: 'Prioridade', tamanhoPadrao: '2' },
      { campo: 'dataInicio', label: 'Data Início', tamanhoPadrao: '2' },
      { campo: 'dataFim', label: 'Data Limite', tamanhoPadrao: '2' },
      { campo: 'horaInicio', label: 'Hora Início', tamanhoPadrao: '2' },
      { campo: 'horaFim', label: 'Hora Fim', tamanhoPadrao: '2' },
      { campo: 'observacoes', label: 'Observações', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'recursoHumano',
    nome: 'Recurso Humano',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    areaLateral: 'Foto',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '1/3' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '1/3' },
      { campo: 'sobrenome', label: 'Sobrenome', tamanhoPadrao: '1/3' },
      { campo: 'dataNascimento', label: 'Data de Nascimento', tamanhoPadrao: '1' },
      { campo: 'sexo', label: 'Sexo', tamanhoPadrao: '1' },
      { campo: 'telefone', label: 'Telefone', tamanhoPadrao: '1' },
      { campo: 'email', label: 'E-mail', tamanhoPadrao: '1' },
      { campo: 'dataContratacao', label: 'Data de Contratação', tamanhoPadrao: '1' },
      { campo: 'custoHora', label: 'Custo/Hora', tamanhoPadrao: '1' },
      { campo: 'departamento', label: 'Departamento', tamanhoPadrao: '1' },
      { campo: 'funcao', label: 'Função', tamanhoPadrao: '1' },
      { campo: 'status', label: 'Status', tamanhoPadrao: '2' },
      { campo: 'anexos', label: 'Anexos', tamanhoPadrao: '2' },
    ],
  },
  {
    id: 'recursoTecnico',
    nome: 'Recurso Técnico',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '1/3' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '2/3' },
      { campo: 'funcaoOperador', label: 'Função do Operador', tamanhoPadrao: '1/3' },
    ],
  },
  {
    id: 'recursoFisico',
    nome: 'Recurso Físico',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'custoHora', label: 'Custo/Hora', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'pessoa',
    nome: 'Pessoa',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    areaLateral: 'Foto',
    // Ordem e larguras padrão = disposição original do formulário de Pessoa.
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'classificacao', label: 'Classificação', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '1/3' },
      { campo: 'sobrenome', label: 'Sobrenome', tamanhoPadrao: '1/3' },
      { campo: 'nomeTrabalho', label: 'Nome de Trabalho', tamanhoPadrao: '1/3' },
      { campo: 'dataNascimento', label: 'Data de Nascimento', tamanhoPadrao: '1/3' },
      { campo: 'sexo', label: 'Sexo', tamanhoPadrao: '1/3' },
      { campo: 'documento', label: 'CPF/Documento', tamanhoPadrao: '1/3' },
      { campo: 'paisNascimento', label: 'País de Nascimento', tamanhoPadrao: '2' },
      { campo: 'idiomaNativo', label: 'Idioma Nativo', tamanhoPadrao: '2' },
      { campo: 'email', label: 'E-mail', tamanhoPadrao: '2' },
      { campo: 'telefone', label: 'Telefone', tamanhoPadrao: '2' },
      { campo: 'endereco', label: 'Endereço', tamanhoPadrao: '4' },
      { campo: 'cidade', label: 'Cidade', tamanhoPadrao: '2' },
      { campo: 'estado', label: 'Estado', tamanhoPadrao: '1' },
      { campo: 'cep', label: 'CEP', tamanhoPadrao: '1' },
      { campo: 'status', label: 'Status', tamanhoPadrao: '1' },
      { campo: 'tags', label: 'Tags', tamanhoPadrao: '4' },
      { campo: 'observacoes', label: 'Observações', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'figurino',
    nome: 'Figurino',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'codigoFigurino', label: 'Código', tamanhoPadrao: '2' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
      { campo: 'tipoFigurino', label: 'Tipo de Figurino', tamanhoPadrao: '1/3' },
      { campo: 'material', label: 'Material', tamanhoPadrao: '1/3' },
      { campo: 'tamanhoPeca', label: 'Tamanho', tamanhoPadrao: '1/3' },
      { campo: 'corPredominante', label: 'Cor Predominante', tamanhoPadrao: '4' },
      { campo: 'corSecundaria', label: 'Cor Secundária', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'fornecedor',
    nome: 'Fornecedor',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '2' },
      { campo: 'categoriaId', label: 'Categoria', tamanhoPadrao: '2' },
      { campo: 'email', label: 'E-mail', tamanhoPadrao: '2' },
      { campo: 'pais', label: 'País', tamanhoPadrao: '2' },
      { campo: 'identificacaoFiscal', label: 'Identificação Fiscal', tamanhoPadrao: '2' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'equipe',
    nome: 'Equipe',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigo', label: 'Código', tamanhoPadrao: '2' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '2' },
    ],
  },
  {
    id: 'unidadeNegocio',
    nome: 'Unidade de Negócio',
    modulo: 'Administração',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '2' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
      { campo: 'moeda', label: 'Moeda', tamanhoPadrao: '2', grupo: 'Tabulador Preferências' },
    ],
  },
  {
    id: 'tabelaPreco',
    nome: 'Tabela de Preço',
    modulo: 'Produção',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '2' },
      { campo: 'unidadeNegocio', label: 'Unidade de Negócio', tamanhoPadrao: '2' },
      { campo: 'status', label: 'Status', tamanhoPadrao: '2' },
      { campo: 'vigenciaInicio', label: 'Vigência De', tamanhoPadrao: '2' },
      { campo: 'vigenciaFim', label: 'Vigência Até', tamanhoPadrao: '2' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'incidenciaGravacao',
    nome: 'Incidência de Gravação',
    modulo: 'Produção',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'titulo', label: 'Título', tamanhoPadrao: '2' },
      { campo: 'gravacaoId', label: 'Gravação', tamanhoPadrao: '2' },
      { campo: 'recursoFisicoId', label: 'Recurso Físico', tamanhoPadrao: '2' },
      { campo: 'severidadeId', label: 'Severidade', tamanhoPadrao: '2' },
      { campo: 'impactoId', label: 'Impacto', tamanhoPadrao: '2' },
      { campo: 'categoriaId', label: 'Categoria', tamanhoPadrao: '2' },
      { campo: 'classificacaoId', label: 'Classificação', tamanhoPadrao: '2' },
      { campo: 'dataIncidencia', label: 'Data da Incidência', tamanhoPadrao: '1/3' },
      { campo: 'horarioIncidencia', label: 'Horário da Incidência', tamanhoPadrao: '1/3' },
      { campo: 'tempoIncidencia', label: 'Tempo da Incidência', tamanhoPadrao: '1/3' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
      { campo: 'causaProvavel', label: 'Causa Provável', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'centroLucro',
    nome: 'Centro de Custos',
    modulo: 'Administração',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'status', label: 'Status', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '4' },
      { campo: 'parentId', label: 'Centro de Custos Pai', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  },

  // ─── Parametrizações genéricas (ParametroFormPage) ───────────────────────────
  parametroForm('cargo', 'Cargo', 'Recursos'),
  parametroForm('categoriaFornecedor', 'Categoria de Fornecedores', 'Recursos'),
  parametroForm('classificacaoPessoa', 'Classificação de Pessoas', 'Recursos'),
  parametroForm('funcao', 'Função', 'Recursos'),
  parametroForm('material', 'Material', 'Recursos'),
  parametroForm('servico', 'Serviço', 'Recursos'),
  parametroForm('tipoFigurino', 'Tipo de Figurino', 'Recursos'),
  parametroForm('classificacao', 'Classificação', 'Produção', { cor: true }),
  parametroForm('tipoGravacao', 'Tipo de Gravação', 'Produção', { cor: true }),
  parametroForm('tipoEvento', 'Tipo de Evento', 'Gestão de Eventos', { cor: true }),
  parametroForm('tipoExpositor', 'Tipo de Expositor', 'Gestão de Eventos', { cor: true }),

  // ─── Parametrizações com título (TituloFormPage) ─────────────────────────────
  tituloForm('statusGravacao', 'Status de Gravação', 'Produção', { tituloLabel: 'Nome' }),
  tituloForm('statusPlaneamento', 'Status de Planeamento', 'Produção', { tituloLabel: 'Nome' }),
  tituloForm('statusTarefa', 'Status de Tarefa', 'Produção', {
    codigoLabel: 'Código',
    tituloLabel: 'Nome',
  }),
  tituloForm('categoriaIncidencia', 'Categoria de Incidência', 'Produção', { cor: false }),
  tituloForm('severidadeIncidencia', 'Severidade de Incidência', 'Produção'),
  tituloForm('impactoIncidencia', 'Impacto de Incidência', 'Produção', { cor: false }),
  tituloForm('statusContaPagar', 'Status de Contas a Pagar', 'Financeiro', {
    flags: [
      { campo: 'isInicial', label: 'Status inicial' },
      { campo: 'isBaixa', label: 'Status de baixa' },
    ],
  }),
  tituloForm('formaPagamento', 'Forma de Pagamento', 'Financeiro', {
    flags: [{ campo: 'isPadrao', label: 'Forma padrão' }],
  }),
  tituloForm('tipoDocumento', 'Tipo de Documento', 'Financeiro'),
  tituloForm('tipoPagamento', 'Tipo de Pagamento', 'Financeiro'),
  tituloForm('categoriaDespesa', 'Categoria de Despesa', 'Financeiro'),
  tituloForm('estadoEvento', 'Estado de Evento', 'SatOps', {
    tituloLabel: 'Nome',
    descricao: false,
  }),
  tituloForm('perfilAcesso', 'Perfil de Acesso', 'Administração', {
    tituloLabel: 'Nome',
    cor: false,
  }),

  // ─── Recursos ────────────────────────────────────────────────────────────────
  {
    id: 'feriado',
    nome: 'Feriado',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'data', label: 'Data', tamanhoPadrao: '1/3' },
      { campo: 'feriado', label: 'Feriado', tamanhoPadrao: '2/3' },
      { campo: 'observacoes', label: 'Observações', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'departamento',
    nome: 'Departamento',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '2' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'espaco',
    nome: 'Espaço',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '4' },
      { campo: 'titulo', label: 'Título', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'turno',
    nome: 'Turno',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'sigla', label: 'Sigla', tamanhoPadrao: '1' },
      { campo: 'nome', label: 'Nome do Turno', tamanhoPadrao: '3' },
      { campo: 'cor', label: 'Cor', tamanhoPadrao: '4' },
      { campo: 'horaInicio', label: 'Início do Turno', tamanhoPadrao: '1/3' },
      { campo: 'horaFim', label: 'Fim do Turno', tamanhoPadrao: '1/3' },
      { campo: 'totalHoras', label: 'Total de Horas', tamanhoPadrao: '1/3' },
      { campo: 'diasSemana', label: 'Dias da Semana e Pessoas por Dia', tamanhoPadrao: '4' },
      { campo: 'diasTrabalhados', label: 'Dias Trabalhados', tamanhoPadrao: '2' },
      { campo: 'folgasPorSemana', label: 'Folgas por Semana', tamanhoPadrao: '2' },
      { campo: 'folgaEspecial', label: 'Folga Especial', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'escala',
    nome: 'Escala',
    modulo: 'Recursos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'titulo', label: 'Título', tamanhoPadrao: '2/3' },
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '1/3' },
      { campo: 'dataInicio', label: 'Início', tamanhoPadrao: '1/3' },
      { campo: 'equipeId', label: 'Equipe', tamanhoPadrao: '2/3' },
    ],
  },

  // ─── Produção ────────────────────────────────────────────────────────────────
  {
    id: 'template',
    nome: 'Template',
    modulo: 'Produção',
    layoutConfiguravel: true,
    campos: [
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
      { campo: 'estado', label: 'Estado', tamanhoPadrao: '4' },
    ],
  },

  // ─── Gestão de Eventos ───────────────────────────────────────────────────────
  {
    id: 'expositor',
    nome: 'Expositor',
    modulo: 'Gestão de Eventos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'logo', label: 'Logo', tamanhoPadrao: '4' },
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome do Expositor', tamanhoPadrao: '2' },
      { campo: 'tipoExpositorId', label: 'Tipo de Expositor', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
      { campo: 'tags', label: 'Tags', tamanhoPadrao: '4' },
      { campo: 'contato', label: 'Contato', tamanhoPadrao: '2', grupo: 'Tabulador Contato' },
      { campo: 'telefone', label: 'Telefone', tamanhoPadrao: '2', grupo: 'Tabulador Contato' },
      { campo: 'email', label: 'E-mail', tamanhoPadrao: '2', grupo: 'Tabulador Contato' },
      { campo: 'instagram', label: 'Instagram', tamanhoPadrao: '4', grupo: 'Tabulador Contato' },
      { campo: 'facebook', label: 'Facebook', tamanhoPadrao: '4', grupo: 'Tabulador Contato' },
    ],
  },
  {
    id: 'evento',
    nome: 'Evento',
    modulo: 'Gestão de Eventos',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome do Evento', tamanhoPadrao: '2' },
      { campo: 'tipoEventoId', label: 'Tipo de Evento', tamanhoPadrao: '2' },
      { campo: 'unidadeNegocioId', label: 'Unidade de Negócio', tamanhoPadrao: '2' },
      { campo: 'descricao', label: 'Descrição do Evento', tamanhoPadrao: '4' },
      { campo: 'tags', label: 'Tags', tamanhoPadrao: '4' },
      { campo: 'inicioEvento', label: 'Início do Evento', tamanhoPadrao: '2' },
      { campo: 'fimEvento', label: 'Fim do Evento', tamanhoPadrao: '2' },
      { campo: 'publicoEstimado', label: 'Público Estimado', tamanhoPadrao: '4' },
      { campo: 'local', label: 'Local', tamanhoPadrao: '4', grupo: 'Tabulador Local & Mapa' },
      { campo: 'latitude', label: 'Latitude', tamanhoPadrao: '2', grupo: 'Tabulador Local & Mapa' },
      {
        campo: 'longitude',
        label: 'Longitude',
        tamanhoPadrao: '2',
        grupo: 'Tabulador Local & Mapa',
      },
    ],
  },

  // ─── Financeiro ──────────────────────────────────────────────────────────────
  {
    id: 'contaPagar',
    nome: 'Conta a Pagar',
    modulo: 'Financeiro',
    layoutConfiguravel: true,
    campos: [
      { campo: 'numeroDocumento', label: 'Nº Documento', tamanhoPadrao: '2' },
      { campo: 'fornecedorId', label: 'Fornecedor', tamanhoPadrao: '2' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
      { campo: 'dataEmissao', label: 'Data Emissão', tamanhoPadrao: '1/3' },
      { campo: 'dataVencimento', label: 'Vencimento', tamanhoPadrao: '1/3' },
      { campo: 'dataPagamento', label: 'Data Pagamento', tamanhoPadrao: '1/3' },
      { campo: 'valor', label: 'Valor (R$)', tamanhoPadrao: '2' },
      { campo: 'valorPago', label: 'Valor Pago (R$)', tamanhoPadrao: '2' },
      { campo: 'statusId', label: 'Status', tamanhoPadrao: '2' },
      { campo: 'categoriaId', label: 'Categoria de Despesa', tamanhoPadrao: '2' },
      { campo: 'formaPagamentoId', label: 'Forma de Pagamento', tamanhoPadrao: '2' },
      { campo: 'tipoDocumentoId', label: 'Tipo de Documento', tamanhoPadrao: '2' },
      { campo: 'observacoes', label: 'Observações', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'orcamento',
    nome: 'Orçamento',
    modulo: 'Financeiro',
    layoutConfiguravel: true,
    campos: [
      { campo: 'ano', label: 'Ano', tamanhoPadrao: '2' },
      { campo: 'centroLucroId', label: 'Centro de Lucro', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  },

  // ─── SatOps ──────────────────────────────────────────────────────────────────
  {
    id: 'alerta',
    nome: 'Alerta',
    modulo: 'SatOps',
    layoutConfiguravel: true,
    campos: [
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '4' },
      { campo: 'tempoParaAlerta', label: 'Tempo para Alerta', tamanhoPadrao: '1/3' },
      { campo: 'regra', label: 'Regra', tamanhoPadrao: '1/3' },
      { campo: 'campoReferencia', label: 'Campo de Referência', tamanhoPadrao: '1/3' },
    ],
  },
  {
    id: 'satelite',
    nome: 'Satélite',
    modulo: 'SatOps',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '2' },
      ...grupo('Parâmetros Técnicos', [
        { campo: 'transponder', label: 'Transponder', tamanhoPadrao: '2' },
        { campo: 'frequenciaUplink', label: 'Frequência Uplink (MHz)', tamanhoPadrao: '2' },
        { campo: 'polarizacao', label: 'Polarização', tamanhoPadrao: '1/3' },
        { campo: 'symbolRate', label: 'Symbol Rate (Msps)', tamanhoPadrao: '1/3' },
        { campo: 'fec', label: 'FEC', tamanhoPadrao: '1/3' },
      ]),
    ],
  },
  {
    id: 'janela',
    nome: 'Janela',
    modulo: 'SatOps',
    layoutConfiguravel: true,
    campos: [
      { campo: 'sateliteId', label: 'Satélite', tamanhoPadrao: '2' },
      { campo: 'dataEvento', label: 'Data do Evento', tamanhoPadrao: '2' },
      { campo: 'tipoEvento', label: 'Tipo de Evento', tamanhoPadrao: '4' },
      // Canal aparece com o tipo; Programa só em "Grelha de Programas"; Título só em "Outro".
      { campo: 'canal', label: 'Canal', tamanhoPadrao: '2' },
      { campo: 'programaId', label: 'Programa', tamanhoPadrao: '2' },
      { campo: 'tituloEvento', label: 'Título do Evento', tamanhoPadrao: '2' },
      ...grupo('Abertura da Janela', [
        { campo: 'aberturaPrevia', label: 'Abertura Prevista (UTC)', tamanhoPadrao: '1/3' },
        { campo: 'aberturaReal', label: 'Abertura Real (UTC)', tamanhoPadrao: '1/3' },
        { campo: 'confirmacaoNocId', label: 'Confirmação NOC', tamanhoPadrao: '1/3' },
        { campo: 'fechoPrevisto', label: 'Fecho Previsto (UTC)', tamanhoPadrao: '2' },
        { campo: 'fechoReal', label: 'Fecho Real (UTC)', tamanhoPadrao: '2' },
      ]),
    ],
  },

  // ─── Administração ───────────────────────────────────────────────────────────
  {
    id: 'usuario',
    nome: 'Usuário',
    modulo: 'Administração',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '2' },
      { campo: 'email', label: 'E-mail', tamanhoPadrao: '2' },
      { campo: 'usuario', label: 'Usuário', tamanhoPadrao: '2' },
      { campo: 'senha', label: 'Senha', tamanhoPadrao: '4' },
      { campo: 'perfilId', label: 'Perfil', tamanhoPadrao: '2' },
      { campo: 'tipoAcesso', label: 'Tipo de Acesso', tamanhoPadrao: '2' },
      { campo: 'role', label: 'Role', tamanhoPadrao: '2' },
      // Só no cadastro de Usuários Globais.
      { campo: 'tenantId', label: 'Tenant', tamanhoPadrao: '2' },
      { campo: 'status', label: 'Status', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  },
  {
    id: 'maestro',
    nome: 'Maestro',
    modulo: 'Administração',
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '2' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '4' },
      { campo: 'cor', label: 'Cor', tamanhoPadrao: '4' },
      { campo: 'status', label: 'Status', tamanhoPadrao: '2' },
      { campo: 'tipo', label: 'Tipo', tamanhoPadrao: '2' },
      { campo: 'modulo', label: 'Módulo', tamanhoPadrao: '4' },
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
      { campo: 'jsonChamada', label: 'JSON da Chamada', tamanhoPadrao: '4' },
      // Só com o tipo "Provys - API Rest"; usuário e senha só em "Basic Auth".
      ...grupo('Configuração da API', [
        { campo: 'endpoint', label: 'Endpoint (URL)', tamanhoPadrao: '4' },
        { campo: 'authTipo', label: 'Tipo de Autorização', tamanhoPadrao: '4' },
        { campo: 'authUsuario', label: 'Usuário', tamanhoPadrao: '2' },
        { campo: 'authSenha', label: 'Senha', tamanhoPadrao: '2' },
      ]),
      ...grupo('Tabulador Esquema de Execução', [
        { campo: 'esquemaTipo', label: 'Tipo de Execução', tamanhoPadrao: '4' },
        { campo: 'esquemaDataInicio', label: 'Data de Início', tamanhoPadrao: '2' },
        { campo: 'esquemaHoraInicio', label: 'Horário de Início', tamanhoPadrao: '2' },
        { campo: 'esquemaDias', label: 'Repetir a cada (dias)', tamanhoPadrao: '4' },
        { campo: 'esquemaDiasSemana', label: 'Dias da Semana', tamanhoPadrao: '4' },
      ]),
    ],
  },
];

/** Campos de uma seção própria do formulário (ver `FormFieldDefinition.grupo`). */
function grupo(nome: string, campos: FormFieldDefinition[]): FormFieldDefinition[] {
  return campos.map((campo) => ({ ...campo, grupo: nome }));
}

/** Formulário de uma parametrização genérica: código externo, nome, cor (opcional) e descrição. */
function parametroForm(
  id: string,
  nome: string,
  modulo: string,
  { cor = false }: { cor?: boolean } = {},
): FormDefinition {
  return {
    id,
    nome,
    modulo,
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo', tamanhoPadrao: '1/3' },
      { campo: 'nome', label: 'Nome', tamanhoPadrao: '2/3' },
      ...(cor ? [{ campo: 'cor', label: 'Cor', tamanhoPadrao: '4' as const }] : []),
      { campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' },
    ],
  };
}

/**
 * Formulário do `TituloFormPage`: código, título/nome, cor, flags e descrição. As opções
 * espelham o `TituloFormConfig` do cadastro (`showCor`, `showDescricao`, `flags`, rótulos).
 */
function tituloForm(
  id: string,
  nome: string,
  modulo: string,
  {
    codigoLabel = 'Código Externo',
    tituloLabel = 'Título',
    cor = true,
    descricao = true,
    flags = [],
  }: {
    codigoLabel?: string;
    tituloLabel?: string;
    cor?: boolean;
    descricao?: boolean;
    flags?: { campo: string; label: string }[];
  } = {},
): FormDefinition {
  return {
    id,
    nome,
    modulo,
    layoutConfiguravel: true,
    campos: [
      { campo: 'codigoExterno', label: codigoLabel, tamanhoPadrao: '1/3' },
      { campo: 'titulo', label: tituloLabel, tamanhoPadrao: '2/3' },
      ...(cor ? [{ campo: 'cor', label: 'Cor', tamanhoPadrao: '4' as const }] : []),
      ...flags.map((flag) => ({ ...flag, tamanhoPadrao: '2' as const })),
      ...(descricao
        ? [{ campo: 'descricao', label: 'Descrição', tamanhoPadrao: '4' as const }]
        : []),
    ],
  };
}

/** Colunas (de 12) e posição padrão de cada campo de um formulário, pela ordem no registro. */
export function getFormLayoutDefaults(formularioId: string): {
  cols: Record<string, number>;
  order: Record<string, number>;
} {
  const campos = formsRegistry.find((form) => form.id === formularioId)?.campos ?? [];
  return {
    cols: Object.fromEntries(
      campos.map((item) => [item.campo, tamanhoToSpan(item.tamanhoPadrao) ?? FORM_GRID_COLUMNS]),
    ),
    order: Object.fromEntries(campos.map((item, index) => [item.campo, index + 1])),
  };
}
