import { ClassificacoesIncidenciaTab } from '@/components/producao/ClassificacoesIncidenciaTab';
import type { Traducoes } from '@/components/shared/TraducaoTab';
import type { TituloFormConfig, TituloFormValues } from '@/components/shared/TituloFormPage.types';
import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';
import {
  ApiParametrizacoesRepository,
  type IncidenciaParametroApiItem,
} from './parametrizacoes.api.repository';

const repository = new ApiParametrizacoesRepository();

function routes(basePath: string, key: string): RecordRouteConfig {
  return { basePath, navStorageKey: `kreato_${key}_nav_ids` };
}

// ─── Status (gravação / planeamento / tarefa) ─────────────────────────────────
// `isInicial` is toggled from the list; the form keeps the loaded value on save.

type StatusItem = {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  isInicial: boolean;
  traducoes?: Record<string, string> | null;
};

function fromStatus(item: StatusItem, codigo: string): TituloFormValues {
  return {
    id: item.id,
    codigoExterno: codigo,
    titulo: item.nome || '',
    descricao: item.descricao || '',
    cor: item.cor || '',
    traducoes: (item.traducoes as Traducoes) ?? {},
    flags: { isInicial: !!item.isInicial },
  };
}

function toStatusInput(values: TituloFormValues) {
  return {
    ...(values.id ? { id: values.id } : {}),
    nome: values.titulo,
    descricao: values.descricao,
    cor: values.cor,
    isInicial: !!values.flags.isInicial,
    traducoes: values.traducoes,
  };
}

const STATUS_BASE = {
  newTitle: 'Novo Status',
  editTitle: 'Editar Status',
  notFoundTitle: 'Status não encontrado',
  nameLabel: 'Nome',
  nameMaxLength: 100,
  codigoMaxLength: 10,
  descricaoPlaceholder: 'Descrição do status...',
} satisfies Partial<TituloFormConfig>;

export const STATUS_GRAVACAO_FORM: TituloFormConfig = {
  formularioId: 'statusGravacao',
  ...STATUS_BASE,
  routes: routes('/producao/status', 'status_gravacao'),
  entityArticle: 'o status de gravação',
  permission: ['Producao', 'Parametrizacoes', 'Status Gravacao'],
  load: async (id) => {
    const item = await repository.getStatusGravacao(id);
    return fromStatus(item, item.codigoExterno || '');
  },
  save: (values) =>
    repository.saveStatusGravacao({
      ...toStatusInput(values),
      codigoExterno: values.codigoExterno,
    }),
  messages: {
    created: 'Status cadastrado com sucesso!',
    updated: 'Status atualizado com sucesso!',
  },
};

export const STATUS_PLANEAMENTO_FORM: TituloFormConfig = {
  formularioId: 'statusPlaneamento',
  ...STATUS_BASE,
  routes: routes('/producao/status-planeamento', 'status_planeamento'),
  entityArticle: 'o status de planeamento',
  permission: ['Producao', 'Parametrizacoes', 'Status Planeamento'],
  load: async (id) => {
    const item = await repository.getStatusPlaneamento(id);
    return fromStatus(item, item.codigoExterno || '');
  },
  save: (values) =>
    repository.saveStatusPlaneamento({
      ...toStatusInput(values),
      codigoExterno: values.codigoExterno,
    }),
  messages: { created: 'Status cadastrado!', updated: 'Status atualizado!' },
};

export const STATUS_TAREFA_FORM: TituloFormConfig = {
  formularioId: 'statusTarefa',
  ...STATUS_BASE,
  routes: routes('/producao/status-tarefa', 'status_tarefa'),
  entityArticle: 'o status de tarefa',
  permission: ['Produção', 'Parametrizações', 'Status Tarefa'],
  codigoLabel: 'Código',
  codigoRequired: true,
  defaultCor: '#888888',
  showTraducao: false,
  load: async (id) => {
    const item = await repository.getStatusTarefa(id);
    return fromStatus(item, item.codigo || '');
  },
  save: (values) =>
    repository.saveStatusTarefa({
      ...toStatusInput(values),
      codigo: values.codigoExterno,
      cor: values.cor || '#888888',
    }),
  messages: { created: 'Salvo com sucesso', updated: 'Salvo com sucesso' },
};

// ─── Incidências (categorias / severidades / impactos) ────────────────────────

function fromIncidencia(item: IncidenciaParametroApiItem): TituloFormValues {
  return {
    id: item.id,
    codigoExterno: item.codigo_externo || '',
    titulo: item.titulo || '',
    descricao: item.descricao || '',
    cor: item.cor || '',
    traducoes: (item.traducoes as Traducoes) ?? {},
    flags: {},
  };
}

function toIncidenciaInput(values: TituloFormValues) {
  return {
    ...(values.id ? { id: values.id } : {}),
    titulo: values.titulo,
    descricao: values.descricao || '',
    codigo_externo: values.codigoExterno || '',
    traducoes: values.traducoes,
  };
}

const INCIDENCIA_BASE = {
  codigoMaxLength: 10,
  showCor: false,
} satisfies Partial<TituloFormConfig>;

export const CATEGORIAS_INCIDENCIA_FORM: TituloFormConfig = {
  formularioId: 'categoriaIncidencia',
  ...INCIDENCIA_BASE,
  routes: routes('/producao/categorias-incidencia', 'categorias_incidencia'),
  newTitle: 'Nova Categoria de Incidência',
  editTitle: 'Editar Categoria de Incidência',
  notFoundTitle: 'Categoria de incidência não encontrada',
  entityArticle: 'a categoria de incidência',
  permission: ['Produção', 'Parametrizações', 'Categorias de Incidência'],
  extraTabs: [
    {
      value: 'classificacoes',
      label: 'Classificações',
      requiresRecord: true,
      render: ({ id, readOnly }) =>
        id ? <ClassificacoesIncidenciaTab categoriaId={id} readOnly={readOnly} /> : null,
    },
  ],
  load: async (id) => fromIncidencia(await repository.getCategoriaIncidencia(id)),
  save: (values) => repository.saveCategoriaIncidencia(toIncidenciaInput(values)),
  messages: {
    created: 'Categoria de Incidência salva!',
    updated: 'Categoria de Incidência atualizada!',
  },
};

export const SEVERIDADES_INCIDENCIA_FORM: TituloFormConfig = {
  formularioId: 'severidadeIncidencia',
  ...INCIDENCIA_BASE,
  routes: routes('/producao/severidades-incidencia', 'severidades_incidencia'),
  newTitle: 'Nova Severidade de Incidência',
  editTitle: 'Editar Severidade de Incidência',
  notFoundTitle: 'Severidade de incidência não encontrada',
  entityArticle: 'a severidade de incidência',
  permission: ['Produção', 'Parametrizações', 'Severidades de Incidência'],
  showCor: true,
  defaultCor: '#888888',
  load: async (id) => fromIncidencia(await repository.getSeveridadeIncidencia(id)),
  save: (values) =>
    repository.saveSeveridadeIncidencia({
      ...toIncidenciaInput(values),
      cor: values.cor || '#888888',
    }),
  messages: {
    created: 'Severidade de Incidência salva!',
    updated: 'Severidade de Incidência atualizada!',
  },
};

export const IMPACTOS_INCIDENCIA_FORM: TituloFormConfig = {
  formularioId: 'impactoIncidencia',
  ...INCIDENCIA_BASE,
  routes: routes('/producao/impactos-incidencia', 'impactos_incidencia'),
  newTitle: 'Novo Impacto de Incidência',
  editTitle: 'Editar Impacto de Incidência',
  notFoundTitle: 'Impacto de incidência não encontrado',
  entityArticle: 'o impacto de incidência',
  permission: ['Produção', 'Parametrizações', 'Impactos de Incidência'],
  load: async (id) => fromIncidencia(await repository.getImpactoIncidencia(id)),
  save: (values) => repository.saveImpactoIncidencia(toIncidenciaInput(values)),
  messages: {
    created: 'Impacto de Incidência salvo!',
    updated: 'Impacto de Incidência atualizado!',
  },
};
