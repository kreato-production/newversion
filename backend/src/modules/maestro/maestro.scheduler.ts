import type { MaestroRecord } from './maestro.repository.js';
import type { MaestroService } from './maestro.service.js';

/**
 * Verifica a cada minuto quais tarefas Maestro estão no horário e as executa.
 * Regras por tipo de esquema:
 *   1-vez   → executa uma única vez na data+hora configurada (se nunca executada antes)
 *   diario  → executa todos os N dias a partir da data de início, no horário configurado
 *   semanal → executa nos dias da semana selecionados, no horário configurado
 *
 * A guarda "já executei neste minuto" evita re-execução em caso de restart do servidor.
 */
export class MaestroScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly service: MaestroService) {}

  start(): void {
    // Alinha o primeiro tick ao próximo minuto cheio para reduzir drift
    const msToNextMinute = (60 - new Date().getSeconds()) * 1_000;
    setTimeout(() => {
      void this.tick();
      this.timer = setInterval(() => void this.tick(), 60_000);
    }, msToNextMinute);

    console.log(`[MaestroScheduler] Iniciado — primeiro tick em ${Math.round(msToNextMinute / 1000)}s`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    const now = new Date();
    try {
      const tasks = await this.service.listForScheduler();
      for (const task of tasks) {
        if (this.isDue(task, now)) {
          console.log(`[MaestroScheduler] Executando "${task.nome}" (${task.id})`);
          this.service.executeScheduled(task.id, task.tenantId).catch((err) => {
            console.error(`[MaestroScheduler] Falha em "${task.nome}" (${task.id}):`, err);
          });
        }
      }
    } catch (err) {
      console.error('[MaestroScheduler] Erro no tick:', err);
    }
  }

  private isDue(task: MaestroRecord, now: Date): boolean {
    if (!task.esquemaHoraInicio) return false;

    const [hh, mm] = task.esquemaHoraInicio.split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return false;

    // O minuto atual deve bater exatamente com o horário configurado
    if (now.getHours() !== hh || now.getMinutes() !== mm) return false;

    // Evita dupla execução se o servidor reiniciou dentro do mesmo minuto
    if (task.ultimaExecucao) {
      const last = task.ultimaExecucao instanceof Date
        ? task.ultimaExecucao
        : new Date(task.ultimaExecucao);
      if (
        last.getFullYear() === now.getFullYear() &&
        last.getMonth()   === now.getMonth()    &&
        last.getDate()    === now.getDate()      &&
        last.getHours()   === hh                 &&
        last.getMinutes() === mm
      ) return false;
    }

    switch (task.esquemaTipo) {
      case '1-vez':   return this.checkOnce(task, now);
      case 'diario':  return this.checkDaily(task, now);
      case 'semanal': return this.checkWeekly(task, now);
      default:        return false;
    }
  }

  /** Executa uma única vez na data configurada (ou imediatamente se sem data). */
  private checkOnce(task: MaestroRecord, now: Date): boolean {
    // Se não há data configurada: executa uma única vez (nunca antes executada)
    if (!task.esquemaDataInicio) return !task.ultimaExecucao;

    // Se há data: só considera "já executado para este agendamento" se
    // ultimaExecucao ocorreu na data agendada ou depois dela
    if (task.ultimaExecucao) {
      const last = task.ultimaExecucao instanceof Date
        ? task.ultimaExecucao
        : new Date(task.ultimaExecucao);
      const [y, m, d] = task.esquemaDataInicio.split('-').map(Number);
      const scheduledStart = new Date(y, m - 1, d);
      if (last >= scheduledStart) return false; // já executou para esta data
    }

    return localDate(now) >= task.esquemaDataInicio;
  }

  /** Executa a cada N dias a partir da data de início. */
  private checkDaily(task: MaestroRecord, now: Date): boolean {
    const interval = task.esquemaDias ?? 1;
    if (!task.esquemaDataInicio) return true;
    const [y, m, d] = task.esquemaDataInicio.split('-').map(Number);
    const start   = new Date(y, m - 1, d);
    const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs  = today.getTime() - start.getTime();
    if (diffMs < 0) return false;
    const diffDays = Math.round(diffMs / 86_400_000);
    return diffDays % interval === 0;
  }

  /** Executa nos dias da semana selecionados (0=Dom … 6=Sáb). */
  private checkWeekly(task: MaestroRecord, now: Date): boolean {
    return (task.esquemaDiasSemana ?? []).includes(now.getDay());
  }
}

/** Retorna a data local no formato YYYY-MM-DD para comparação com datas armazenadas como texto. */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
