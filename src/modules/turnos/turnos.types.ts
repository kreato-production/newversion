export type WeekdayKey = 'dom' | 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';

export type WeekdayFlags = Record<WeekdayKey, boolean>;
export type PeoplePerDay = Record<WeekdayKey, number>;

export type Turno = {
  id: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: WeekdayFlags;
  pessoasPorDia: PeoplePerDay;
  cor: string;
  sigla: string;
  folgasPorSemana: number;
  folgaEspecial: string;
  descricao: string;
  diasTrabalhados: number | null;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type TurnoInput = {
  id?: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: WeekdayFlags;
  pessoasPorDia: PeoplePerDay;
  cor: string;
  sigla?: string;
  folgasPorSemana: number;
  folgaEspecial?: string;
  descricao?: string;
  diasTrabalhados?: number | null;
};

export const weekdayKeys: WeekdayKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

export function createEmptyWeekdayFlags(): WeekdayFlags {
  return {
    dom: false,
    seg: false,
    ter: false,
    qua: false,
    qui: false,
    sex: false,
    sab: false,
  };
}

export function createEmptyPeoplePerDay(): PeoplePerDay {
  return {
    dom: 0,
    seg: 0,
    ter: 0,
    qua: 0,
    qui: 0,
    sex: 0,
    sab: 0,
  };
}
