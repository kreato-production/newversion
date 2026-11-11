import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TituloFormValues } from '@/components/shared/TituloFormPage.types';

const repo = vi.hoisted(() => ({
  getStatusGravacao: vi.fn(),
  saveStatusGravacao: vi.fn(),
  getStatusTarefa: vi.fn(),
  saveStatusTarefa: vi.fn(),
  getSeveridadeIncidencia: vi.fn(),
  saveSeveridadeIncidencia: vi.fn(),
}));

vi.mock('./parametrizacoes.api.repository', () => ({
  ApiParametrizacoesRepository: class {
    constructor() {
      Object.assign(this, repo);
    }
  },
}));
vi.mock('@/components/producao/ClassificacoesIncidenciaTab', () => ({
  ClassificacoesIncidenciaTab: (): null => null,
}));

const {
  STATUS_GRAVACAO_FORM,
  STATUS_TAREFA_FORM,
  SEVERIDADES_INCIDENCIA_FORM,
  CATEGORIAS_INCIDENCIA_FORM,
} = await import('./producao.forms');

const values = (overrides: Partial<TituloFormValues> = {}): TituloFormValues => ({
  id: 'id1',
  codigoExterno: 'C1',
  titulo: 'Em gravação',
  descricao: 'desc',
  cor: '#ff0000',
  traducoes: { en: 'Recording' },
  flags: { isInicial: true },
  ...overrides,
});

describe('producao.forms', () => {
  beforeEach(() => {
    Object.values(repo).forEach((fn) => fn.mockReset());
  });

  it('status de gravacao envia as traducoes e preserva isInicial ao salvar', async () => {
    await STATUS_GRAVACAO_FORM.save(values());

    expect(repo.saveStatusGravacao).toHaveBeenCalledWith({
      id: 'id1',
      codigoExterno: 'C1',
      nome: 'Em gravação',
      descricao: 'desc',
      cor: '#ff0000',
      isInicial: true,
      traducoes: { en: 'Recording' },
    });
  });

  it('status de gravacao carrega nome como titulo e isInicial como flag', async () => {
    repo.getStatusGravacao.mockResolvedValue({
      id: 'id1',
      codigoExterno: 'C1',
      nome: 'Em gravação',
      descricao: '',
      cor: '#00ff00',
      isInicial: true,
      traducoes: null,
    });

    await expect(STATUS_GRAVACAO_FORM.load('id1')).resolves.toMatchObject({
      codigoExterno: 'C1',
      titulo: 'Em gravação',
      traducoes: {},
      flags: { isInicial: true },
    });
  });

  it('status de tarefa usa codigo (obrigatorio) e nao envia id na inclusao', async () => {
    expect(STATUS_TAREFA_FORM.codigoRequired).toBe(true);
    expect(STATUS_TAREFA_FORM.showTraducao).toBe(false);

    await STATUS_TAREFA_FORM.save(
      values({ id: undefined, codigoExterno: 'T1', cor: '', flags: {} }),
    );

    expect(repo.saveStatusTarefa).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo: 'T1',
        nome: 'Em gravação',
        cor: '#888888',
        isInicial: false,
      }),
    );
    expect(repo.saveStatusTarefa.mock.calls[0][0]).not.toHaveProperty('id');
  });

  it('severidade envia codigo_externo e cor padrao', async () => {
    await SEVERIDADES_INCIDENCIA_FORM.save(values({ cor: '' }));

    expect(repo.saveSeveridadeIncidencia).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'id1',
        titulo: 'Em gravação',
        codigo_externo: 'C1',
        cor: '#888888',
      }),
    );
  });

  it('categoria de incidencia tem a aba de classificacoes so na edicao', () => {
    expect(CATEGORIAS_INCIDENCIA_FORM.extraTabs).toEqual([
      expect.objectContaining({ value: 'classificacoes', requiresRecord: true }),
    ]);
    expect(CATEGORIAS_INCIDENCIA_FORM.showCor).toBe(false);
  });
});
