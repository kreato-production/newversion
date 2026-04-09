import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { TurnosRepository, WeekdayKey } from './turnos.repository.js';

const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;
const weekdayKeys: WeekdayKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const weekDayFlagsSchema = z.object({
  dom: z.boolean(),
  seg: z.boolean(),
  ter: z.boolean(),
  qua: z.boolean(),
  qui: z.boolean(),
  sex: z.boolean(),
  sab: z.boolean(),
});

const peoplePerDaySchema = z.object({
  dom: z.number().int().min(0),
  seg: z.number().int().min(0),
  ter: z.number().int().min(0),
  qua: z.number().int().min(0),
  qui: z.number().int().min(0),
  sex: z.number().int().min(0),
  sab: z.number().int().min(0),
});

export const saveTurnoSchema = z.object({
  id: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  nome: z.string().trim().min(1),
  horaInicio: z.string().regex(timePattern, 'Hora inicial invalida'),
  horaFim: z.string().regex(timePattern, 'Hora final invalida'),
  diasSemana: weekDayFlagsSchema,
  pessoasPorDia: peoplePerDaySchema,
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor invalida'),
  sigla: z.string().trim().max(20).optional().nullable(),
  folgasPorSemana: z.number().int().min(0).max(7),
  folgaEspecial: z.string().trim().max(80).optional().nullable(),
  descricao: z.string().trim().max(500).optional().nullable(),
  diasTrabalhados: z.number().int().min(0).max(7).optional().nullable(),
});

export type SaveTurnoDto = z.infer<typeof saveTurnoSchema>;

export class TurnosService {
  constructor(private readonly repository: TurnosRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        nome: item.nome,
        horaInicio: item.horaInicio,
        horaFim: item.horaFim,
        diasSemana: item.diasSemana,
        pessoasPorDia: item.pessoasPorDia,
        cor: item.cor,
        sigla: item.sigla ?? '',
        folgasPorSemana: item.folgasPorSemana,
        folgaEspecial: item.folgaEspecial ?? '',
        descricao: item.descricao ?? '',
        diasTrabalhados: item.diasTrabalhados,
        dataCadastro: item.createdAt.toISOString(),
        usuarioCadastro: item.createdBy ?? '',
      })),
    };
  }

  async save(actor: SessionUser, input: SaveTurnoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Turno nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const duplicate = await this.repository.findByNome(tenantId, input.nome.trim());
    if (duplicate && duplicate.id !== input.id) {
      throw new Error('Ja existe um turno cadastrado com este nome');
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      nome: input.nome.trim(),
      horaInicio: input.horaInicio,
      horaFim: input.horaFim,
      diasSemana: input.diasSemana,
      pessoasPorDia: this.normalizePeoplePerDay(input.pessoasPorDia, input.diasSemana),
      cor: input.cor,
      sigla: input.sigla?.trim() || null,
      folgasPorSemana: input.folgasPorSemana,
      folgaEspecial: input.folgaEspecial?.trim() || null,
      descricao: input.descricao?.trim() || null,
      diasTrabalhados: input.diasTrabalhados ?? null,
      createdBy: actor.nome,
    });

    return {
      id: item.id,
      nome: item.nome,
      horaInicio: item.horaInicio,
      horaFim: item.horaFim,
      diasSemana: item.diasSemana,
      pessoasPorDia: item.pessoasPorDia,
      cor: item.cor,
      sigla: item.sigla ?? '',
      folgasPorSemana: item.folgasPorSemana,
      folgaEspecial: item.folgaEspecial ?? '',
      descricao: item.descricao ?? '',
      diasTrabalhados: item.diasTrabalhados,
      dataCadastro: item.createdAt.toISOString(),
      usuarioCadastro: item.createdBy ?? '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Turno nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  private normalizePeoplePerDay(
    peoplePerDay: SaveTurnoDto['pessoasPorDia'],
    weekDays: SaveTurnoDto['diasSemana'],
  ) {
    return weekdayKeys.reduce<Record<WeekdayKey, number>>((acc, key) => {
      acc[key] = weekDays[key] ? peoplePerDay[key] : 0;
      return acc;
    }, { dom: 0, seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0 });
  }
}
