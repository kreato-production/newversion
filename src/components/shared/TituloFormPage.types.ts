import type { ReactNode } from 'react';
import type { Traducoes } from '@/components/shared/TraducaoTab';
import type { RecordRouteConfig } from '@/hooks/useRecordNavigation';

/**
 * Values edited by `TituloFormPage`, normalized across the simple parametrizations
 * (status, severidades, impactos, categorias, financial parameters...).
 * `titulo` is the main name field, whatever its label ("Título" or "Nome").
 */
export interface TituloFormValues {
  id?: string;
  codigoExterno: string;
  titulo: string;
  descricao: string;
  cor: string;
  traducoes: Traducoes;
  /**
   * Boolean fields. Only the ones listed in `TituloFormConfig.flags` are shown; others
   * returned by `load` are kept untouched and sent back on save (e.g. `isInicial`,
   * toggled from the list).
   */
  flags: Record<string, boolean>;
}

export interface TituloFormFlag {
  key: string;
  label: string;
  description: string;
}

export interface TituloFormTab {
  value: string;
  label: string;
  /** Only available once the record exists (edit mode). */
  requiresRecord?: boolean;
  render: (context: {
    id: string | undefined;
    readOnly: boolean;
    values: TituloFormValues;
  }) => ReactNode;
}

export interface TituloFormConfig {
  routes: RecordRouteConfig;
  /**
   * Id do formulário em Administração > Formulários (`src/data/formsRegistry.ts`). Campos:
   * `codigoExterno`, `titulo`, `cor`, a `key` de cada flag e `descricao`.
   */
  formularioId: string;
  newTitle: string;
  editTitle: string;
  notFoundTitle: string;
  /** Used in "Preencha os campos abaixo para cadastrar <entityArticle>." */
  entityArticle: string;
  load: (id: string) => Promise<TituloFormValues>;
  save: (values: TituloFormValues) => Promise<unknown>;
  messages: { created: string; updated: string };

  /** `[modulo, subModulo1, subModulo2?]` checked with canIncluir / canAlterar. */
  permission?: [string, string, string?];

  /** Label of the main name field (default "Título"). */
  nameLabel?: string;
  nameMaxLength?: number;
  /** Label of the code field (default "Código Externo"). */
  codigoLabel?: string;
  codigoMaxLength?: number;
  codigoRequired?: boolean;

  showCor?: boolean;
  defaultCor?: string;
  showDescricao?: boolean;
  descricaoPlaceholder?: string;
  showTraducao?: boolean;
  flags?: TituloFormFlag[];
  /** Additional tabs after "Dados Gerais" (e.g. a sub-list of child records). */
  extraTabs?: TituloFormTab[];
}
