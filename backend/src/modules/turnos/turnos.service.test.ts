import type { SessionUser } from '../auth/auth.types.js';
import { describe, expect, it } from 'vitest';
import { TurnosService } from './turnos.service.js';
import type {
  SaveTurnoInput,
  TurnoRecord,
  TurnosRepository,
  WeekdayKey,
} from './turnos.repository.js';

class InMemoryTurnosRepository implements TurnosRepository {
  items = new Map<string, TurnoRecord>();

  async listByTenant(tenantId: string) {
    const data = [...this.items.values()].filter((item) => item.tenantId === tenantId);
    return { data, total: data.length };
  }

  async findById(id: string) {
    return this.items.get(id) ?? null;
  }

  async findByNome(tenantId: string, nome: string) {
    return [...this.items.values()].find(
      (item) => item.tenantId === tenantId && item.nome.toLowerCase() === nome.toLowerCase(),
    ) ?? null;
  }

  async save(input: SaveTurnoInput) {
    const item: TurnoRecord = {
      id: input.id ?? crypto.randomUUID(),
      tenantId: input.tenantId,
      nome: input.nome,
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
      diasSemana: input.diasSemana,
      pessoasPorDia: input.pessoasPorDia,
      cor: input.cor,
      sigla: input.sigla ?? null,
      folgasPorSemana: input.folgasPorSemana,
      folgaEspecial: input.folgaEspecial ?? null,
      descricao: input.descricao ?? null,
      diasTrabalhados: input.diasTrabalhados ?? null,
      createdAt: new Date('2026-04-08T10:00:00.000Z'),
      createdBy: input.createdBy ?? null,
    };
    this.items.set(item.id, item);
    return item;
  }

  async remove(id: string) {
    this.items.delete(id);
  }
}

const actor: SessionUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  nome: 'Admin',
  email: 'admin@kreato.app',
  usuario: 'admin',
  role: 'TENANT_ADMIN',
  perfil: 'Administrador Tenant',
  tipoAcesso: 'Operacional',
  unidadeIds: [],
  enabledModules: ['Dashboard', 'Recursos'],
  permissions: [],
};

function weekdayFlags(active: WeekdayKey[] = []) {
  return {
    dom: active.includes('dom'),
    seg: active.includes('seg'),
    ter: active.includes('ter'),
    qua: active.includes('qua'),
    qui: active.includes('qui'),
    sex: active.includes('sex'),
    sab: active.includes('sab'),
  };
}

function peoplePerDay(value = 2) {
  return {
    dom: value,
    seg: value,
    ter: value,
    qua: value,
    qui: value,
    sex: value,
    sab: value,
  };
}

describe('TurnosService', () => {
  it('lista apenas turnos do tenant do ator', async () => {
    const repository = new InMemoryTurnosRepository();
    await repository.save({
      tenantId: 'tenant-1',
      nome: 'Turno A',
      horaInicio: '08:00:00',
      horaFim: '17:00:00',
      diasSemana: weekdayFlags(['seg']),
      pessoasPorDia: peoplePerDay(3),
      cor: '#3B82F6',
      folgasPorSemana: 2,
      createdBy: actor.nome,
    });
    await repository.save({
      tenantId: 'tenant-2',
      nome: 'Turno B',
      horaInicio: '09:00:00',
      horaFim: '18:00:00',
      diasSemana: weekdayFlags(['ter']),
      pessoasPorDia: peoplePerDay(1),
      cor: '#EF4444',
      folgasPorSemana: 1,
      createdBy: actor.nome,
    });

    const service = new TurnosService(repository);
    const result = await service.list(actor);

    expect(result.total).toBe(1);
    expect(result.data[0]?.nome).toBe('Turno A');
  });

  it('zera pessoas por dia em dias inativos ao salvar', async () => {
    const repository = new InMemoryTurnosRepository();
    const service = new TurnosService(repository);

    const saved = await service.save(actor, {
      nome: 'Turno Manhã',
      horaInicio: '08:00:00',
      horaFim: '17:00:00',
      diasSemana: weekdayFlags(['seg', 'qua']),
      pessoasPorDia: {
        dom: 4,
        seg: 3,
        ter: 4,
        qua: 2,
        qui: 4,
        sex: 4,
        sab: 4,
      },
      cor: '#3B82F6',
      sigla: ' TM ',
      folgasPorSemana: 2,
      folgaEspecial: '2_domingos_mes',
      descricao: '  Operacao diurna ',
      diasTrabalhados: 2,
    });

    expect(saved.sigla).toBe('TM');
    expect(saved.descricao).toBe('Operacao diurna');
    expect(saved.pessoasPorDia).toEqual({
      dom: 0,
      seg: 3,
      ter: 0,
      qua: 2,
      qui: 0,
      sex: 0,
      sab: 0,
    });
  });

  it('impede cadastrar nome duplicado no mesmo tenant', async () => {
    const repository = new InMemoryTurnosRepository();
    await repository.save({
      tenantId: 'tenant-1',
      nome: 'Turno Noite',
      horaInicio: '20:00:00',
      horaFim: '05:00:00',
      diasSemana: weekdayFlags(['seg', 'ter']),
      pessoasPorDia: peoplePerDay(2),
      cor: '#111827',
      folgasPorSemana: 2,
      createdBy: actor.nome,
    });

    const service = new TurnosService(repository);

    await expect(
      service.save(actor, {
        nome: 'turno noite',
        horaInicio: '21:00:00',
        horaFim: '06:00:00',
        diasSemana: weekdayFlags(['qua']),
        pessoasPorDia: peoplePerDay(1),
        cor: '#1F2937',
        folgasPorSemana: 1,
      }),
    ).rejects.toThrow('Ja existe um turno cadastrado com este nome');
  });
});
