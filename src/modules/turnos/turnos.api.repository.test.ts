import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiTurnosRepository } from './turnos.api.repository';
import { apiRequest } from '@/lib/api/http';

vi.mock('@/lib/api/http', () => ({
  apiRequest: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('turnos.api.repository', () => {
  it('lista turnos a partir da resposta paginada da API', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      total: 1,
      data: [{ id: 'turno-1', nome: 'Turno A' }],
    });

    const repository = new ApiTurnosRepository();
    const result = await repository.list();

    expect(apiRequest).toHaveBeenCalledWith('/turnos');
    expect(result).toEqual([{ id: 'turno-1', nome: 'Turno A' }]);
  });

  it('usa POST para criar e PUT para atualizar', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: 'turno-1' });
    const repository = new ApiTurnosRepository();

    await repository.save({
      nome: 'Turno A',
      horaInicio: '08:00:00',
      horaFim: '17:00:00',
      diasSemana: { dom: false, seg: true, ter: true, qua: true, qui: true, sex: true, sab: false },
      pessoasPorDia: { dom: 0, seg: 2, ter: 2, qua: 2, qui: 2, sex: 2, sab: 0 },
      cor: '#3B82F6',
      folgasPorSemana: 2,
    });

    await repository.save({
      id: 'turno-1',
      nome: 'Turno B',
      horaInicio: '09:00:00',
      horaFim: '18:00:00',
      diasSemana: {
        dom: false,
        seg: true,
        ter: false,
        qua: true,
        qui: false,
        sex: true,
        sab: false,
      },
      pessoasPorDia: { dom: 0, seg: 1, ter: 0, qua: 1, qui: 0, sex: 1, sab: 0 },
      cor: '#EF4444',
      folgasPorSemana: 3,
    });

    expect(apiRequest).toHaveBeenNthCalledWith(
      1,
      '/turnos',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(apiRequest).toHaveBeenNthCalledWith(
      2,
      '/turnos/turno-1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('remove turno via DELETE', async () => {
    vi.mocked(apiRequest).mockResolvedValue(undefined);
    const repository = new ApiTurnosRepository();

    await repository.remove('turno-1');

    expect(apiRequest).toHaveBeenCalledWith(
      '/turnos/turno-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
