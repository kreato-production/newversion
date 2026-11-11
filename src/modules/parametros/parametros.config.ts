/**
 * Configuration of the generic parametrization screens (`ParametroListPage` / `ParametroFormPage`).
 * Shared by the list view and its `novo` / `[id]` form routes.
 */
export interface ParametroPageConfig {
  title: string;
  description: string;
  /** Singular label of a record, e.g. "Cargo". */
  entityName: string;
  /** Backend resource key (`/parametros/:storageKey`); also used for table/view preferences. */
  storageKey: string;
  permissionPath?: [string, string, string?];
  showExportImport?: boolean;
  showCor?: boolean;
  /** Id do formulário em Administração > Formulários (`src/data/formsRegistry.ts`). */
  formularioId: string;
}

export const PARAMETROS = {
  cargos: {
    title: 'Cargos',
    description: 'Gerencie os cargos dos recursos humanos',
    entityName: 'Cargo',
    storageKey: 'kreato_cargos',
    formularioId: 'cargo',
    permissionPath: ['Recursos', 'Parametrizações', 'Cargos'],
  },
  categoriaFornecedores: {
    title: 'Categoria de Fornecedores',
    description: 'Gerencie as categorias de fornecedores',
    entityName: 'Categoria',
    storageKey: 'kreato_categoria_fornecedores',
    formularioId: 'categoriaFornecedor',
    permissionPath: ['Recursos', 'Parametrizações', 'Categoria Fornecedores'],
  },
  classificacaoPessoas: {
    title: 'Classificação de Pessoas',
    description: 'Gerencie as classificações de pessoas (Jogador de Futebol, Atriz, Ator, etc.)',
    entityName: 'Classificação',
    storageKey: 'kreato_classificacao_pessoas',
    formularioId: 'classificacaoPessoa',
    permissionPath: ['Recursos', 'Parametrizações', 'Classificação Pessoas'],
  },
  funcoes: {
    title: 'Funções',
    description: 'Gerencie as funções disponíveis',
    entityName: 'Função',
    storageKey: 'kreato_funcoes',
    formularioId: 'funcao',
    permissionPath: ['Recursos', 'Parametrizações', 'Funções'],
  },
  material: {
    title: 'Material',
    description: 'Gerencie os materiais disponíveis para os figurinos',
    entityName: 'Material',
    storageKey: 'kreato_material',
    formularioId: 'material',
    permissionPath: ['Recursos', 'Parametrizações', 'Material'],
  },
  servicos: {
    title: 'Serviços',
    description: 'Gerencie os serviços oferecidos',
    entityName: 'Serviço',
    storageKey: 'kreato_servicos',
    formularioId: 'servico',
    permissionPath: ['Recursos', 'Parametrizações', 'Serviços'],
  },
  tipoFigurino: {
    title: 'Tipo de Figurino',
    description: 'Gerencie os tipos de figurino disponíveis no sistema',
    entityName: 'Tipo de Figurino',
    storageKey: 'kreato_tipo_figurino',
    formularioId: 'tipoFigurino',
    permissionPath: ['Recursos', 'Parametrizações', 'Tipo Figurino'],
  },
  classificacao: {
    title: 'Classificação',
    description: 'Gerencie as classificações de conteúdo',
    entityName: 'Classificação',
    storageKey: 'kreato_classificacao',
    formularioId: 'classificacao',
    permissionPath: ['Produção', 'Parametrizações', 'Classificação'],
    showCor: true,
  },
  tiposGravacao: {
    title: 'Tipos de Gravação',
    description: 'Gerencie os tipos de gravação disponíveis no sistema',
    entityName: 'Tipo de Gravação',
    storageKey: 'kreato_tipos_gravacao',
    formularioId: 'tipoGravacao',
    permissionPath: ['Produção', 'Parametrizações', 'Tipos Gravação'],
    showCor: true,
  },
  tipoEvento: {
    title: 'Tipo de Evento',
    description: 'Gerencie os tipos de evento disponíveis no sistema',
    entityName: 'Tipo de Evento',
    storageKey: 'kreato_tipo_evento',
    formularioId: 'tipoEvento',
    permissionPath: ['Gestão de Eventos', 'Parametrizações', 'Tipo de Evento'],
    showCor: true,
  },
  tipoExpositor: {
    title: 'Tipo de Expositor',
    description: 'Gerencie os tipos de expositor disponíveis no sistema',
    entityName: 'Tipo de Expositor',
    storageKey: 'kreato_tipo_expositor',
    formularioId: 'tipoExpositor',
    permissionPath: ['Gestão de Eventos', 'Parametrizações', 'Tipo de Expositor'],
    showCor: true,
  },
} satisfies Record<string, ParametroPageConfig>;

export type ParametroKey = keyof typeof PARAMETROS;

/** sessionStorage key with the list order used by previous/next on the form page. */
export function parametroNavStorageKey(storageKey: string): string {
  return `${storageKey}_nav_ids`;
}
