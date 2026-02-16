// Registry of all system forms and their fields
// Used by the "Formulários" admin module to configure field validation

export interface FormFieldDefinition {
  campo: string;
  label: string;
}

export interface FormDefinition {
  id: string;
  nome: string;
  modulo: string;
  campos: FormFieldDefinition[];
}

export const formsRegistry: FormDefinition[] = [
  {
    id: 'conteudo',
    nome: 'Conteúdo',
    modulo: 'Produção',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'descricao', label: 'Descrição' },
      { campo: 'quantidadeEpisodios', label: 'Qtd. Episódios' },
      { campo: 'unidadeNegocio', label: 'Unidade de Negócio' },
      { campo: 'centroLucro', label: 'Centro de Lucro' },
      { campo: 'tipoConteudo', label: 'Tipo de Conteúdo' },
      { campo: 'classificacao', label: 'Classificação' },
      { campo: 'anoProducao', label: 'Ano de Produção' },
      { campo: 'sinopse', label: 'Sinopse' },
      { campo: 'orcamento', label: 'Orçamento' },
      { campo: 'tabelaPrecoId', label: 'Tabela de Preço' },
      { campo: 'recursosTecnicos', label: 'Recursos Técnicos' },
      { campo: 'recursosFisicos', label: 'Recursos Físicos' },
    ],
  },
  {
    id: 'gravacao',
    nome: 'Gravação',
    modulo: 'Produção',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'nome', label: 'Nome' },
      { campo: 'unidadeNegocio', label: 'Unidade de Negócio' },
      { campo: 'centroLucro', label: 'Centro de Lucro' },
      { campo: 'tipoConteudo', label: 'Tipo de Conteúdo' },
      { campo: 'classificacao', label: 'Classificação' },
      { campo: 'status', label: 'Status' },
      { campo: 'conteudoId', label: 'Conteúdo' },
      { campo: 'dataPrevista', label: 'Data Prevista' },
      { campo: 'descricao', label: 'Descrição' },
      { campo: 'orcamento', label: 'Orçamento' },
    ],
  },
  {
    id: 'tarefa',
    nome: 'Tarefa',
    modulo: 'Produção',
    campos: [
      { campo: 'titulo', label: 'Título da Tarefa' },
      { campo: 'descricao', label: 'Descrição' },
      { campo: 'gravacaoId', label: 'Gravação' },
      { campo: 'statusId', label: 'Status' },
      { campo: 'recursoHumanoId', label: 'Responsável' },
      { campo: 'prioridade', label: 'Prioridade' },
      { campo: 'dataInicio', label: 'Data Início' },
      { campo: 'dataFim', label: 'Data Limite' },
      { campo: 'observacoes', label: 'Observações' },
    ],
  },
  {
    id: 'recursoHumano',
    nome: 'Recurso Humano',
    modulo: 'Recursos',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'nome', label: 'Nome' },
      { campo: 'sobrenome', label: 'Sobrenome' },
      { campo: 'email', label: 'E-mail' },
      { campo: 'telefone', label: 'Telefone' },
      { campo: 'sexo', label: 'Sexo' },
      { campo: 'dataNascimento', label: 'Data de Nascimento' },
      { campo: 'dataContratacao', label: 'Data de Contratação' },
      { campo: 'custoHora', label: 'Custo/Hora' },
      { campo: 'departamento', label: 'Departamento' },
      { campo: 'funcao', label: 'Função' },
      { campo: 'status', label: 'Status' },
    ],
  },
  {
    id: 'recursoTecnico',
    nome: 'Recurso Técnico',
    modulo: 'Recursos',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'nome', label: 'Nome' },
      { campo: 'funcaoOperador', label: 'Função do Operador' },
    ],
  },
  {
    id: 'recursoFisico',
    nome: 'Recurso Físico',
    modulo: 'Recursos',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'nome', label: 'Nome' },
      { campo: 'custoHora', label: 'Custo/Hora' },
    ],
  },
  {
    id: 'pessoa',
    nome: 'Pessoa',
    modulo: 'Recursos',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'classificacao', label: 'Classificação' },
      { campo: 'nome', label: 'Nome' },
      { campo: 'sobrenome', label: 'Sobrenome' },
      { campo: 'nomeTrabalho', label: 'Nome de Trabalho' },
      { campo: 'dataNascimento', label: 'Data de Nascimento' },
      { campo: 'sexo', label: 'Sexo' },
      { campo: 'documento', label: 'Documento' },
      { campo: 'email', label: 'E-mail' },
      { campo: 'telefone', label: 'Telefone' },
      { campo: 'endereco', label: 'Endereço' },
      { campo: 'cidade', label: 'Cidade' },
      { campo: 'estado', label: 'Estado' },
      { campo: 'cep', label: 'CEP' },
      { campo: 'observacoes', label: 'Observações' },
      { campo: 'status', label: 'Status' },
    ],
  },
  {
    id: 'figurino',
    nome: 'Figurino',
    modulo: 'Recursos',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'codigoFigurino', label: 'Código' },
      { campo: 'descricao', label: 'Descrição' },
      { campo: 'tipoFigurino', label: 'Tipo de Figurino' },
      { campo: 'material', label: 'Material' },
      { campo: 'tamanhoPeca', label: 'Tamanho' },
      { campo: 'corPredominante', label: 'Cor Predominante' },
      { campo: 'corSecundaria', label: 'Cor Secundária' },
    ],
  },
  {
    id: 'fornecedor',
    nome: 'Fornecedor',
    modulo: 'Recursos',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'nome', label: 'Nome' },
      { campo: 'identificacaoFiscal', label: 'Identificação Fiscal' },
      { campo: 'categoriaId', label: 'Categoria' },
      { campo: 'email', label: 'E-mail' },
      { campo: 'pais', label: 'País' },
      { campo: 'descricao', label: 'Descrição' },
    ],
  },
  {
    id: 'equipe',
    nome: 'Equipe',
    modulo: 'Recursos',
    campos: [
      { campo: 'codigo', label: 'Código' },
      { campo: 'descricao', label: 'Descrição' },
    ],
  },
  {
    id: 'unidadeNegocio',
    nome: 'Unidade de Negócio',
    modulo: 'Administração',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'nome', label: 'Nome' },
      { campo: 'moeda', label: 'Moeda' },
      { campo: 'descricao', label: 'Descrição' },
    ],
  },
  {
    id: 'tabelaPreco',
    nome: 'Tabela de Preço',
    modulo: 'Produção',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'nome', label: 'Nome' },
      { campo: 'unidadeNegocio', label: 'Unidade de Negócio' },
      { campo: 'status', label: 'Status' },
      { campo: 'vigenciaInicio', label: 'Vigência De' },
      { campo: 'vigenciaFim', label: 'Vigência Até' },
      { campo: 'descricao', label: 'Descrição' },
    ],
  },
  {
    id: 'centroLucro',
    nome: 'Centro de Lucro',
    modulo: 'Administração',
    campos: [
      { campo: 'codigoExterno', label: 'Código Externo' },
      { campo: 'nome', label: 'Nome' },
      { campo: 'parentId', label: 'Centro de Lucro Pai' },
      { campo: 'status', label: 'Status' },
      { campo: 'descricao', label: 'Descrição' },
    ],
  },
];
