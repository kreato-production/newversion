import { RecordFormPage } from '@/components/shared/RecordFormPage';
import { UsuarioFormBody } from '@/components/admin/UsuarioFormBody';
import { ApiUsuariosRepository } from '@/modules/usuarios/usuarios.api.repository';
import { USUARIOS_ROUTES } from '@/modules/usuarios/usuarios.navigation';
import type { Usuario } from '@/views/admin/Usuarios';

const repository = new ApiUsuariosRepository();

/** Administração > Usuários: users of a tenant (role USER or TENANT_ADMIN). */
const UsuarioForm = ({ id }: { id?: string }) => (
  <RecordFormPage<Usuario, Usuario>
    id={id}
    routes={USUARIOS_ROUTES}
    newTitle="Novo Usuário"
    editTitle={(record) => record?.nome || 'Editar Usuário'}
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
        perfil: data.perfil || '',
        perfilId: data.perfilId || undefined,
        descricao: data.descricao || '',
        status: data.status || 'Ativo',
        tipoAcesso: data.tipoAcesso || 'Operacional',
        recursoHumanoId: data.recursoHumanoId || undefined,
        tenantId: data.tenantId ?? null,
        role: data.role,
        dataCadastro: data.dataCadastro,
        usuarioCadastro: data.usuarioCadastro,
      } as Parameters<ApiUsuariosRepository['save']>[0])
    }
    messages={{ created: 'Usuario criado com sucesso!', updated: 'Usuario atualizado!' }}
  >
    {(props) => <UsuarioFormBody {...props} showTenantSelector />}
  </RecordFormPage>
);

export default UsuarioForm;
