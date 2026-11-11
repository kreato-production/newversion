import type { Traducoes } from '@/components/shared/TraducaoTab';
import type { TituloFormConfig } from '@/components/shared/TituloFormPage.types';
import { ApiSatOpsRepository } from './satops.api.repository';

const repository = new ApiSatOpsRepository();

export const ESTADOS_EVENTO_FORM: TituloFormConfig = {
  routes: { basePath: '/satops/estados-evento', navStorageKey: 'kreato_estados_evento_nav_ids' },
  newTitle: 'Novo Estado de Evento',
  editTitle: 'Editar Estado de Evento',
  notFoundTitle: 'Estado de evento não encontrado',
  entityArticle: 'o estado de evento',
  permission: ['SatOps', 'Parametrizacoes', 'EstadosEvento'],
  nameLabel: 'Nome',
  nameMaxLength: 100,
  codigoMaxLength: 20,
  showDescricao: false,
  load: async (id) => {
    const item = await repository.getEstadoEvento(id);
    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      titulo: item.nome || '',
      descricao: '',
      cor: item.cor || '',
      traducoes: (item.traducoes as Traducoes) ?? {},
      flags: {},
    };
  },
  save: (values) =>
    repository.saveEstadoEvento({
      ...(values.id ? { id: values.id } : {}),
      codigoExterno: values.codigoExterno,
      nome: values.titulo,
      cor: values.cor,
      traducoes: values.traducoes,
    }),
  messages: { created: 'Estado cadastrado!', updated: 'Estado atualizado!' },
};
