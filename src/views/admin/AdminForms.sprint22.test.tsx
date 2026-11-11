/**
 * SPRINT-22 (Administração / Global): behaviour that must survive the move from modals to
 * form pages — role forcing for global admins, no client-side ids on create, tenant admin
 * validation, and the Unidade de Negócio dialog kept for Tenant > Unidades.
 */
import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GlobalUsuarioForm from './GlobalUsuarioForm';
import UsuarioForm from './UsuarioForm';
import { TenantFormBody } from '@/components/admin/TenantFormBody';
import { UnidadeNegocioFormModal } from '@/components/admin/UnidadeNegocioFormModal';
import { PERFIS_ACESSO_FORM } from '@/modules/parametros/perfis-acesso.form';

const push = vi.fn();
const toast = vi.fn();
const usuariosRepo = vi.hoisted(() => ({ getById: vi.fn(), save: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ canIncluir: () => true, canAlterar: () => true }),
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { nome: 'Admin', role: 'GLOBAL_ADMIN', tenantId: null as string | null },
  }),
}));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => ({ 'common.save': 'Salvar' })[key] ?? key }),
}));
vi.mock('@/components/shared/PageComponents', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('@/components/shared/ListActionBar', () => ({
  ListActionBar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/modules/usuarios/usuarios.api.repository', () => ({
  ApiUsuariosRepository: class {
    getById = usuariosRepo.getById;
    save = usuariosRepo.save;
  },
}));
vi.mock('@/modules/tenants/tenants.api.repository', () => ({
  ApiTenantsRepository: class {
    list = vi.fn().mockResolvedValue([]);
  },
}));
vi.mock('@/modules/parametros/parametros.api.repository', () => ({
  ApiParametrosRepository: class {
    list = vi.fn().mockResolvedValue([]);
    getById = vi.fn();
    save = vi.fn();
  },
}));
vi.mock('@/components/admin/UnidadesNegocioTab', () => ({ UnidadesNegocioTab: (): null => null }));
vi.mock('@/components/admin/UsuarioProgramasTab', () => ({
  UsuarioProgramasTab: (): null => null,
}));
vi.mock('@/components/admin/UsuarioEquipesTab', () => ({ UsuarioEquipesTab: (): null => null }));
vi.mock('@/components/admin/TenantLicencasTab', () => ({ TenantLicencasTab: (): null => null }));
vi.mock('@/components/admin/TenantModulosTab', () => ({ TenantModulosTab: (): null => null }));
vi.mock('@/components/admin/TenantUnidadesTab', () => ({ TenantUnidadesTab: (): null => null }));
vi.mock('@/components/admin/PermissoesTab', () => ({ default: () => <div>permissoes-tab</div> }));

const VALID_PASSWORD = 'Senha@Forte123';

function fillNewUser() {
  fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'Maria' } });
  fireEvent.change(screen.getByLabelText(/E-?mail/i), { target: { value: 'maria@kreato.app' } });
  fireEvent.change(screen.getByLabelText(/^Usu[aá]rio/), { target: { value: 'maria' } });
  fireEvent.change(screen.getByLabelText(/^Senha/), { target: { value: VALID_PASSWORD } });
}

describe('Global > Usuários (GlobalUsuarioForm)', () => {
  beforeEach(() => {
    push.mockClear();
    usuariosRepo.save.mockReset().mockResolvedValue(undefined);
    sessionStorage.clear();
  });

  it('cria admin global forçando o papel GLOBAL_ADMIN, sem id gerado no navegador', async () => {
    render(<GlobalUsuarioForm />);
    fillNewUser();
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() => expect(usuariosRepo.save).toHaveBeenCalled());
    const payload = usuariosRepo.save.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({ role: 'GLOBAL_ADMIN', tipoAcesso: 'Global', usuario: 'maria' }),
    );
    expect(payload).not.toHaveProperty('id');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/global/usuarios'));
  });
});

describe('Administração > Usuários (UsuarioForm)', () => {
  beforeEach(() => {
    push.mockClear();
    usuariosRepo.save.mockReset().mockResolvedValue(undefined);
    usuariosRepo.getById.mockReset();
  });

  it('nao envia a senha vazia ao editar e usa o id da URL', async () => {
    usuariosRepo.getById.mockResolvedValue({
      id: 'u1',
      codigoExterno: '',
      nome: 'Joao',
      email: 'joao@kreato.app',
      usuario: 'joao',
      senha: '',
      foto: '',
      perfil: '',
      descricao: '',
      status: 'Ativo',
      tipoAcesso: 'Operacional',
      tenantId: 't1',
      role: 'USER',
      dataCadastro: '',
      usuarioCadastro: '',
    });
    render(<UsuarioForm id="u1" />);

    expect(await screen.findByDisplayValue('Joao')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() => expect(usuariosRepo.save).toHaveBeenCalled());
    const payload = usuariosRepo.save.mock.calls[0][0];
    expect(payload).toEqual(expect.objectContaining({ id: 'u1', role: 'USER', tenantId: 't1' }));
    expect(payload).not.toHaveProperty('senha');
  });
});

describe('TenantFormBody', () => {
  beforeEach(() => {
    toast.mockClear();
  });

  const renderTenant = (onSubmit = vi.fn()) => {
    render(
      <>
        <TenantFormBody formId="tenant" data={null} readOnly={false} onSubmit={onSubmit} />
        <button type="submit" form="tenant">
          salvar
        </button>
      </>,
    );
    return onSubmit;
  };

  it('marca os dados do administrador como obrigatorios ao criar', () => {
    renderTenant();
    for (const id of ['adminNome', 'adminUsuario', 'adminSenha']) {
      expect(document.getElementById(id)).toBeRequired();
    }
  });

  it('recusa senha do administrador fora da politica', async () => {
    const onSubmit = renderTenant();
    fireEvent.change(document.getElementById('nome')!, { target: { value: 'Novo Tenant' } });
    fireEvent.change(document.getElementById('adminNome')!, { target: { value: 'Admin' } });
    fireEvent.change(document.getElementById('adminUsuario')!, { target: { value: 'admin_novo' } });
    fireEvent.change(document.getElementById('adminSenha')!, { target: { value: 'fraca' } });
    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Senha inválida' })),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia o tenant com o administrador quando valido', async () => {
    const onSubmit = renderTenant(vi.fn().mockResolvedValue(undefined));
    fireEvent.change(document.getElementById('nome')!, { target: { value: 'Novo Tenant' } });
    fireEvent.change(document.getElementById('adminNome')!, { target: { value: 'Admin' } });
    fireEvent.change(document.getElementById('adminUsuario')!, { target: { value: 'admin_novo' } });
    fireEvent.change(document.getElementById('adminSenha')!, { target: { value: VALID_PASSWORD } });
    fireEvent.click(screen.getByText('salvar'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Novo Tenant',
          adminUsuario: 'admin_novo',
          adminSenha: VALID_PASSWORD,
        }),
      ),
    );
  });
});

describe('UnidadeNegocioFormModal (Tenant > Unidades)', () => {
  it('continua salvando e fechando o dialogo sobre o mesmo formulario', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<UnidadeNegocioFormModal isOpen onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'Unidade Lisboa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Unidade Lisboa' })),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe('PERFIS_ACESSO_FORM', () => {
  it('tem a aba de permissoes apenas na edicao e sem cor/traducao', () => {
    expect(PERFIS_ACESSO_FORM.extraTabs).toEqual([
      expect.objectContaining({ value: 'permissoes', requiresRecord: true }),
    ]);
    expect(PERFIS_ACESSO_FORM.showCor).toBe(false);
    expect(PERFIS_ACESSO_FORM.showTraducao).toBe(false);
  });
});
