import PermissoesTab from '@/components/admin/PermissoesTab';
import type { TituloFormConfig } from '@/components/shared/TituloFormPage.types';
import { ApiParametrosRepository } from './parametros.api.repository';

const repository = new ApiParametrosRepository();
const STORAGE_KEY = 'kreato_perfis_acesso';

export const PERFIS_ACESSO_FORM: TituloFormConfig = {
  routes: { basePath: '/admin/perfis', navStorageKey: 'kreato_perfis_acesso_nav_ids' },
  newTitle: 'Novo Perfil de Acesso',
  editTitle: 'Editar Perfil de Acesso',
  notFoundTitle: 'Perfil não encontrado',
  entityArticle: 'o perfil de acesso',
  nameLabel: 'Nome',
  nameMaxLength: 100,
  codigoMaxLength: 10,
  showCor: false,
  showTraducao: false,
  extraTabs: [
    {
      value: 'permissoes',
      label: 'Permissões',
      requiresRecord: true,
      render: ({ id, values }) =>
        id ? <PermissoesTab perfilId={id} perfilNome={values.titulo} /> : null,
    },
  ],
  load: async (id) => {
    const item = await repository.getById(STORAGE_KEY, id);
    return {
      id: item.id,
      codigoExterno: item.codigo_externo || '',
      titulo: item.nome,
      descricao: item.descricao || '',
      cor: '',
      traducoes: {},
      flags: {},
    };
  },
  save: (values) =>
    repository.save(STORAGE_KEY, {
      ...(values.id ? { id: values.id } : {}),
      codigoExterno: values.codigoExterno || '',
      nome: values.titulo,
      descricao: values.descricao || '',
    }),
  messages: { created: 'Perfil salvo!', updated: 'Perfil atualizado!' },
};
