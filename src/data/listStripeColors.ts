/**
 * Cores pastel das linhas intercaladas (lista zebrada), configuradas por formulário em
 * Administração > Formulários > Lista. Gravamos a chave (`value`), não a cor: assim a paleta
 * pode ser ajustada sem migrar dados. No tema escuro a mesma cor é aplicada bem mais suave
 * (`.list-zebra` em src/app/globals.css).
 */
export interface ListStripeColor {
  value: string;
  label: string;
  color: string;
}

export const LIST_STRIPE_COLORS: ListStripeColor[] = [
  { value: 'azul', label: 'Azul', color: '#E3EEFB' },
  { value: 'celeste', label: 'Celeste', color: '#E0F4FA' },
  { value: 'menta', label: 'Menta', color: '#DFF5EC' },
  { value: 'verde', label: 'Verde', color: '#E8F5E1' },
  { value: 'amarelo', label: 'Amarelo', color: '#FDF6D8' },
  { value: 'pessego', label: 'Pêssego', color: '#FDEBDD' },
  { value: 'rosa', label: 'Rosa', color: '#FBE6EE' },
  { value: 'lilas', label: 'Lilás', color: '#F1E8F8' },
  { value: 'lavanda', label: 'Lavanda', color: '#E9E8FA' },
  { value: 'cinza', label: 'Cinza', color: '#EEF1F4' },
];

/** Cor usada quando a lista é zebrada e nenhuma cor foi escolhida. */
export const DEFAULT_STRIPE_COLOR = 'azul';

/** Aparência da lista do módulo de um formulário. */
export interface FormularioListaConfig {
  zebrado: boolean;
  /** Chave de `LIST_STRIPE_COLORS`. */
  corZebra: string | null;
}

export const DEFAULT_LISTA_CONFIG: FormularioListaConfig = { zebrado: false, corZebra: null };

/** Cor (hex) das linhas intercaladas, ou null quando a lista não é zebrada. */
export function stripeColorOf(lista: FormularioListaConfig | null | undefined): string | null {
  if (!lista?.zebrado) return null;
  const byKey = (key: string | null) => LIST_STRIPE_COLORS.find((item) => item.value === key);
  return (byKey(lista.corZebra) ?? byKey(DEFAULT_STRIPE_COLOR))!.color;
}

/** Formulários cuja lista do módulo já aplica a aparência configurada (useFormListStyle). */
export const FORMS_WITH_LIST_STYLE = new Set([
  'programa',
  'conteudo',
  'gravacao',
  'tarefa',
  'recursoHumano',
  'recursoTecnico',
  'recursoFisico',
  'pessoa',
  'figurino',
  'fornecedor',
  'equipe',
  'unidadeNegocio',
  'tabelaPreco',
  'incidenciaGravacao',
  'centroLucro',
  // Parametrizações genéricas (ParametroListPage)
  'cargo',
  'categoriaFornecedor',
  'classificacaoPessoa',
  'funcao',
  'material',
  'servico',
  'tipoFigurino',
  'classificacao',
  'tipoGravacao',
  'tipoEvento',
  'tipoExpositor',
  // Parametrizações com título
  'statusGravacao',
  'statusPlaneamento',
  'statusTarefa',
  'categoriaIncidencia',
  'severidadeIncidencia',
  'impactoIncidencia',
  'statusContaPagar',
  'formaPagamento',
  'tipoDocumento',
  'tipoPagamento',
  'categoriaDespesa',
  'estadoEvento',
  'perfilAcesso',
  // Cadastros
  'feriado',
  'departamento',
  'espaco',
  'turno',
  'escala',
  'template',
  'expositor',
  'evento',
  'contaPagar',
  'orcamento',
  'alerta',
  'satelite',
  'janela',
  'usuario',
  'maestro',
]);
