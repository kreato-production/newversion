import type { Traducoes } from '@/components/shared/TraducaoTab';
import type { TituloFormConfig, TituloFormValues } from '@/components/shared/TituloFormPage.types';
import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';
import {
  ApiParametrizacoesRepository,
  type CategoriaDespesaApiItem,
} from './parametrizacoes.api.repository';

const repository = new ApiParametrizacoesRepository();

function routes(basePath: string, key: string): RecordRouteConfig {
  return { basePath, navStorageKey: `kreato_${key}_nav_ids` };
}

/** Items using snake_case (tipos de documento, tipos de pagamento, categorias de despesa). */
type TituloApiItem = CategoriaDespesaApiItem;

function fromTituloItem(item: TituloApiItem): TituloFormValues {
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

function toTituloInput(values: TituloFormValues) {
  return {
    id: values.id,
    codigo_externo: values.codigoExterno,
    titulo: values.titulo,
    descricao: values.descricao,
    cor: values.cor,
    traducoes: values.traducoes,
  };
}

export const STATUS_CONTAS_PAGAR_FORM: TituloFormConfig = {
  routes: routes('/financeiro/status-contas-pagar', 'status_contas_pagar'),
  newTitle: 'Novo Status',
  editTitle: 'Editar Status',
  notFoundTitle: 'Status não encontrado',
  entityArticle: 'o status de contas a pagar',
  descricaoPlaceholder: 'Descrição do status...',
  flags: [
    {
      key: 'isInicial',
      label: 'Status inicial',
      description: 'Define o status padrão ao criar uma conta a pagar.',
    },
    {
      key: 'isBaixa',
      label: 'Status de baixa',
      description: 'Indica que esse status representa a baixa financeira da conta.',
    },
  ],
  load: async (id) => {
    const item = await repository.getStatusContaPagar(id);
    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      titulo: item.titulo || '',
      descricao: item.descricao || '',
      cor: item.cor || '',
      traducoes: (item.traducoes as Traducoes) ?? {},
      flags: { isInicial: !!item.isInicial, isBaixa: !!item.isBaixa },
    };
  },
  save: (values) =>
    repository.saveStatusContaPagar({
      id: values.id,
      codigoExterno: values.codigoExterno,
      titulo: values.titulo,
      descricao: values.descricao,
      cor: values.cor,
      isInicial: !!values.flags.isInicial,
      isBaixa: !!values.flags.isBaixa,
      traducoes: values.traducoes,
    }),
  messages: { created: 'Status criado com sucesso', updated: 'Status atualizado com sucesso' },
};

export const FORMAS_PAGAMENTO_FORM: TituloFormConfig = {
  routes: routes('/financeiro/formas-pagamento', 'formas_pagamento'),
  newTitle: 'Nova Forma de Pagamento',
  editTitle: 'Editar Forma de Pagamento',
  notFoundTitle: 'Forma de pagamento não encontrada',
  entityArticle: 'a forma de pagamento',
  descricaoPlaceholder: 'Descrição da forma de pagamento...',
  flags: [
    {
      key: 'isPadrao',
      label: 'Forma padrão',
      description: 'Define esta forma como a opção padrão para novos registos financeiros.',
    },
  ],
  load: async (id) => {
    const item = await repository.getFormaPagamento(id);
    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      titulo: item.titulo || '',
      descricao: item.descricao || '',
      cor: item.cor || '',
      traducoes: (item.traducoes as Traducoes) ?? {},
      flags: { isPadrao: !!item.isPadrao },
    };
  },
  save: (values) =>
    repository.saveFormaPagamento({
      id: values.id,
      codigoExterno: values.codigoExterno,
      titulo: values.titulo,
      descricao: values.descricao,
      cor: values.cor,
      isPadrao: !!values.flags.isPadrao,
      traducoes: values.traducoes,
    }),
  messages: {
    created: 'Forma de pagamento criada com sucesso',
    updated: 'Forma de pagamento atualizada com sucesso',
  },
};

export const TIPOS_DOCUMENTOS_FORM: TituloFormConfig = {
  routes: routes('/financeiro/tipos-documentos', 'tipos_documentos_financeiro'),
  newTitle: 'Novo Tipo de Documento',
  editTitle: 'Editar Tipo de Documento',
  notFoundTitle: 'Tipo de documento não encontrado',
  entityArticle: 'o tipo de documento',
  descricaoPlaceholder: 'Descrição do tipo de documento...',
  load: async (id) => fromTituloItem(await repository.getTipoDocumentoFinanceiro(id)),
  save: (values) => repository.saveTipoDocumentoFinanceiro(toTituloInput(values)),
  messages: {
    created: 'Tipo de documento criado com sucesso',
    updated: 'Tipo de documento atualizado com sucesso',
  },
};

export const TIPOS_PAGAMENTO_FORM: TituloFormConfig = {
  routes: routes('/financeiro/tipos-pagamento', 'tipos_pagamento'),
  newTitle: 'Novo Tipo de Pagamento',
  editTitle: 'Editar Tipo de Pagamento',
  notFoundTitle: 'Tipo de pagamento não encontrado',
  entityArticle: 'o tipo de pagamento',
  descricaoPlaceholder: 'Descrição do tipo de pagamento...',
  load: async (id) => fromTituloItem(await repository.getTipoPagamento(id)),
  save: (values) => repository.saveTipoPagamento(toTituloInput(values)),
  messages: {
    created: 'Tipo de pagamento criado com sucesso',
    updated: 'Tipo de pagamento atualizado com sucesso',
  },
};

export const CATEGORIAS_DESPESA_FORM: TituloFormConfig = {
  routes: routes('/financeiro/categorias-despesa', 'categorias_despesa'),
  newTitle: 'Nova Categoria de Despesa',
  editTitle: 'Editar Categoria de Despesa',
  notFoundTitle: 'Categoria de despesa não encontrada',
  entityArticle: 'a categoria de despesa',
  descricaoPlaceholder: 'Descrição da categoria de despesa...',
  load: async (id) => fromTituloItem(await repository.getCategoriaDespesa(id)),
  save: (values) => repository.saveCategoriaDespesa(toTituloInput(values)),
  messages: {
    created: 'Categoria de despesa criada com sucesso',
    updated: 'Categoria de despesa atualizada com sucesso',
  },
};
