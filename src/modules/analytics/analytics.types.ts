export interface DashboardRecordingSummary {
  id: string;
  nome: string;
  codigo: string;
  dataPrevista: string | null;
  status: string | null;
}

export interface DashboardOverviewResponse {
  stats: {
    gravacoes: number;
    gravacoesAtivas: number;
    conteudos: number;
    recursosHumanos: number;
    recursosTecnicos: number;
    recursosFisicos: number;
    unidades: number;
    fornecedores: number;
  };
  gravacoesSemana: DashboardRecordingSummary[];
  gravacoes: DashboardRecordingSummary[];
}

export interface GravacaoBasicInfo {
  id: string;
  codigo: string;
  nome: string;
  dataPrevista: string | null;
  descricao: string | null;
  status: string | null;
  unidadeNegocio: string | null;
  unidadeNegocioLogo: string | null;
  unidadeNegocioMoeda: string;
  centroLucro: string | null;
  classificacao: string | null;
  tipoConteudo: string | null;
  conteudo: string | null;
}

export interface CenaData {
  id: string;
  ordem: number;
  capitulo: string;
  numeroCena: string;
  ambiente: string;
  tipoAmbiente: string;
  periodo: string;
  localGravacao: string;
  personagens: string[];
  figurantes: string[];
  tempoAproximado: string;
  ritmo: string;
  descricao: string;
}

export interface RecursoData {
  id: string;
  tipo: 'humano' | 'fisico' | 'tecnico';
  nome: string;
  funcao?: string;
  horaInicio?: string;
  horaFim?: string;
  estoqueItem?: string;
}

export interface ElencoData {
  id: string;
  nome: string;
  nomeTrabalho?: string;
  personagem: string;
}

export interface ConvidadoData {
  id: string;
  nome: string;
  nomeTrabalho?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
}

export interface FigurinoData {
  id: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino?: string;
  tamanhoPeca?: string;
  observacoes?: string;
}

export interface TerceiroData {
  id: string;
  fornecedorNome: string;
  servicoNome: string;
  custo: number;
}

export interface CustoItem {
  categoria: string;
  recurso: string;
  descricao: string;
  horas: number;
  custoUnitario: number;
  custoTotal: number;
}

export interface GravacaoReportData {
  basicInfo: GravacaoBasicInfo;
  cenas: CenaData[];
  recursos: RecursoData[];
  elenco: ElencoData[];
  convidados: ConvidadoData[];
  figurinos: FigurinoData[];
  terceiros: TerceiroData[];
  custos: CustoItem[];
  totais: {
    horasTotais: number;
    custoTotal: number;
    custoTerceiros: number;
  };
}
