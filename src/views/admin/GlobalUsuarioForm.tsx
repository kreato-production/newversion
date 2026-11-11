import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { UsuarioFormBody } from '@/components/admin/UsuarioFormBody';
import { ApiUsuariosRepository } from '@/modules/usuarios/usuarios.api.repository';
import { GLOBAL_USUARIOS_ROUTES } from '@/modules/usuarios/usuarios.navigation';
import type { Usuario } from '@/views/admin/Usuarios';

const repository = new ApiUsuariosRepository();

/** Global > Usuários: global administrators. Role and access type are always forced. */
const GlobalUsuarioForm = ({ id }: { id?: string }) => (
  <RecordFormPage<Usuario, Usuario>
    id={id}
    routes={GLOBAL_USUARIOS_ROUTES}
    newTitle="Novo Admin Global"
    editTitle={(record) => record?.nome || 'Editar Admin Global'}
    notFoundTitle="Usuário não encontrado"
    load={async (recordId) => (await repository.getById(recordId)) as Usuario}
    save={(data) =>
      repository.save({
        ...(id ? { id } : {}),
        codigoExterno: data.codigoExterno || '',
        nome: data.nome,
        email: data.email,
        usuario: data.usuario,
        ...(data.senha ? { senha: data.senha } : {}),
        foto: data.foto || '',
        perfil: data.perfil || 'Admin Global',
        descricao: data.descricao || '',
        status: data.status || 'Ativo',
        tipoAcesso: 'Global',
        role: 'GLOBAL_ADMIN',
        dataCadastro: data.dataCadastro,
        usuarioCadastro: data.usuarioCadastro,
      } as Parameters<ApiUsuariosRepository['save']>[0])
    }
    messages={{ created: 'Admin global criado com sucesso!', updated: 'Admin global atualizado!' }}
  >
    {(props) => <UsuarioFormBody {...props} />}
  </RecordFormPage>
);

export default GlobalUsuarioForm;
