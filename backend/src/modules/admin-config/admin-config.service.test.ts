import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../auth/auth.types.js';
import type {
  AdminConfigRepository,
  FormularioCampoRecord,
  FormularioListaRecord,
  PerfilRecord,
  PermissionRecord,
} from './admin-config.repository.js';
import { AdminConfigService, normalizeTraducoes, saveFormularioCamposSchema } from './admin-config.service.js';

class InMemoryAdminConfigRepository implements AdminConfigRepository {
  readonly campos = new Map<string, FormularioCampoRecord[]>();
  readonly listas = new Map<string, FormularioListaRecord>();

  async getFormularioLista(tenantId: string, formularioId: string): Promise<FormularioListaRecord | null> {
    return this.listas.get(`${tenantId}:${formularioId}`) ?? null;
  }

  async saveFormularioLista(tenantId: string, formularioId: string, lista: FormularioListaRecord): Promise<void> {
    this.listas.set(`${tenantId}:${formularioId}`, lista);
  }

  async findPerfilById(): Promise<PerfilRecord | null> {
    return null;
  }

  async listPerfilPermissions(): Promise<PermissionRecord[]> {
    return [];
  }

  async replacePerfilPermissions(): Promise<void> {}

  async listFormularioCampos(tenantId: string, formularioId: string): Promise<FormularioCampoRecord[]> {
    return this.campos.get(`${tenantId}:${formularioId}`) ?? [];
  }

  async replaceFormularioCampos(tenantId: string, formularioId: string, campos: FormularioCampoRecord[]): Promise<void> {
    // Same rule as the Prisma repository: rows with nothing configured are not stored.
    this.campos.set(
      `${tenantId}:${formularioId}`,
      campos.filter((c) => c.tipoValidacao || c.tamanho != null || c.posicao != null || c.traducoes),
    );
  }
}

const actor = { id: 'u1', tenantId: 't1', role: 'TENANT_ADMIN' } as SessionUser;

describe('AdminConfigService — traduções dos campos do formulário', () => {
  it('grava e devolve as traduções (sem as em branco); campo só com tradução também é gravado', async () => {
    const repository = new InMemoryAdminConfigRepository();
    const service = new AdminConfigService(repository);

    const body = saveFormularioCamposSchema.parse({
      campos: [
        { campo: 'nome', tipoValidacao: null, traducoes: { en: ' First name ', es: '', pt: 'Nome' } },
        { campo: 'email', tipoValidacao: null, traducoes: { en: '   ' } },
        { campo: 'sexo', tipoValidacao: 'obrigatorio' },
      ],
    });
    await service.saveFormularioCampos(actor, 'pessoa', body);

    const result = await service.getFormularioCampos(actor, 'pessoa');
    expect(result.campos).toEqual([
      { campo: 'nome', tipoValidacao: null, tamanho: null, posicao: null, traducoes: { en: 'First name', pt: 'Nome' } },
      { campo: 'sexo', tipoValidacao: 'obrigatorio', tamanho: null, posicao: null, traducoes: null },
    ]);
  });

  it('recusa idioma inválido e rótulo longo demais', () => {
    expect(() =>
      saveFormularioCamposSchema.parse({ campos: [{ campo: 'nome', tipoValidacao: null, traducoes: { 'x y': 'A' } }] }),
    ).toThrow();
    expect(() =>
      saveFormularioCamposSchema.parse({
        campos: [{ campo: 'nome', tipoValidacao: null, traducoes: { en: 'a'.repeat(121) } }],
      }),
    ).toThrow();
  });

  it('normalizeTraducoes', () => {
    expect(normalizeTraducoes(undefined)).toBeNull();
    expect(normalizeTraducoes({ en: ' ' })).toBeNull();
    expect(normalizeTraducoes({ en: ' Name ' })).toEqual({ en: 'Name' });
  });
});

describe('AdminConfigService — isolamento por tenant dos formulários', () => {
  const tenantA = '11111111-1111-1111-1111-111111111111';
  const tenantB = '22222222-2222-2222-2222-222222222222';
  const adminA = { id: 'a', tenantId: tenantA, role: 'TENANT_ADMIN' } as SessionUser;
  const adminB = { id: 'b', tenantId: tenantB, role: 'TENANT_ADMIN' } as SessionUser;
  const globalAdmin = { id: 'g', tenantId: null, role: 'GLOBAL_ADMIN' } as unknown as SessionUser;
  const body = { campos: [{ campo: 'nome', tipoValidacao: 'obrigatorio' as const }] };

  it('a configuração gravada pelo tenant A não aparece para o tenant B', async () => {
    const service = new AdminConfigService(new InMemoryAdminConfigRepository());
    await service.saveFormularioCampos(adminA, 'programa', body);

    expect((await service.getFormularioCampos(adminA, 'programa')).campos).toHaveLength(1);
    const outro = await service.getFormularioCampos(adminB, 'programa');
    expect(outro.tenantId).toBe(tenantB);
    expect(outro.campos).toHaveLength(0);
  });

  it('cada tenant mantém a própria configuração do mesmo formulário', async () => {
    const service = new AdminConfigService(new InMemoryAdminConfigRepository());
    await service.saveFormularioCampos(adminA, 'programa', body);
    await service.saveFormularioCampos(adminB, 'programa', {
      campos: [{ campo: 'nome', tipoValidacao: 'sugerido' as const }],
    });

    expect((await service.getFormularioCampos(adminA, 'programa')).campos[0].tipoValidacao).toBe('obrigatorio');
    expect((await service.getFormularioCampos(adminB, 'programa')).campos[0].tipoValidacao).toBe('sugerido');
  });

  it('usuário de tenant não lê nem grava outro tenant via tenantId', async () => {
    const service = new AdminConfigService(new InMemoryAdminConfigRepository());
    await service.saveFormularioCampos(adminA, 'programa', body);

    await expect(service.getFormularioCampos(adminB, 'programa', tenantA)).rejects.toThrow('fora do tenant');
    await expect(service.saveFormularioCampos(adminB, 'programa', body, tenantA)).rejects.toThrow('fora do tenant');
    expect((await service.getFormularioCampos(adminA, 'programa')).campos).toHaveLength(1);
  });

  it('GLOBAL_ADMIN grava só no tenant escolhido; sem tenant lê vazio e não grava', async () => {
    const service = new AdminConfigService(new InMemoryAdminConfigRepository());
    await service.saveFormularioCampos(globalAdmin, 'programa', body, tenantA);

    expect((await service.getFormularioCampos(adminA, 'programa')).campos).toHaveLength(1);
    expect((await service.getFormularioCampos(adminB, 'programa')).campos).toHaveLength(0);
    expect((await service.getFormularioCampos(globalAdmin, 'programa', tenantA)).campos).toHaveLength(1);
    expect(await service.getFormularioCampos(globalAdmin, 'programa')).toEqual({
      formulario: 'programa',
      tenantId: null,
      campos: [],
    });
    await expect(service.saveFormularioCampos(globalAdmin, 'programa', body)).rejects.toThrow('obrigatorio');
  });
});

describe('AdminConfigService — aparência da lista (tabulador Lista)', () => {
  it('sem configuração a lista não é zebrada; grava zebra e cor, e sem zebra a cor é descartada', async () => {
    const service = new AdminConfigService(new InMemoryAdminConfigRepository());
    expect((await service.getFormularioCampos(actor, 'pessoa')).lista).toEqual({ zebrado: false, corZebra: null });

    await service.saveFormularioCampos(actor, 'pessoa', { campos: [], lista: { zebrado: true, corZebra: 'menta' } });
    expect((await service.getFormularioCampos(actor, 'pessoa')).lista).toEqual({ zebrado: true, corZebra: 'menta' });

    await service.saveFormularioCampos(actor, 'pessoa', { campos: [], lista: { zebrado: false, corZebra: 'menta' } });
    expect((await service.getFormularioCampos(actor, 'pessoa')).lista).toEqual({ zebrado: false, corZebra: null });
  });

  it('sem lista no corpo, a aparência gravada não muda', async () => {
    const service = new AdminConfigService(new InMemoryAdminConfigRepository());
    await service.saveFormularioCampos(actor, 'pessoa', { campos: [], lista: { zebrado: true, corZebra: 'rosa' } });
    await service.saveFormularioCampos(actor, 'pessoa', { campos: [] });
    expect((await service.getFormularioCampos(actor, 'pessoa')).lista).toEqual({ zebrado: true, corZebra: 'rosa' });
  });

  it('recusa cor com formato inválido', () => {
    expect(() =>
      saveFormularioCamposSchema.parse({ campos: [], lista: { zebrado: true, corZebra: '#fff; color: red' } }),
    ).toThrow();
  });
});
