import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/shared/ColorPicker';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ConfigurableFieldGrid,
  FieldAsterisk,
  useFormFieldConfig,
} from '@/hooks/useFormFieldConfig';
import type { Turno, TurnoInput, WeekdayKey } from '@/modules/turnos/turnos.types';
import { createEmptyPeoplePerDay, createEmptyWeekdayFlags } from '@/modules/turnos/turnos.types';

const emptyFormData: TurnoInput = {
  nome: '',
  horaInicio: '08:00',
  horaFim: '17:00',
  diasSemana: createEmptyWeekdayFlags(),
  pessoasPorDia: createEmptyPeoplePerDay(),
  cor: '#3B82F6',
  sigla: '',
  folgasPorSemana: 0,
  folgaEspecial: '',
  descricao: '',
  diasTrabalhados: null,
};

// Mon-first display order
const displayOrder: WeekdayKey[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

const dayLabels: Record<WeekdayKey, string> = {
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
  dom: 'Dom',
};

const FOLGA_OPTIONS: { value: string; label: string }[] = [
  { value: '1_domingo_mes', label: '1 domingo por mês' },
  { value: '2_domingos_mes', label: '2 domingos por mês' },
  { value: '1_sabado_mes', label: '1 sábado por mês' },
  { value: '2_sabados_mes', label: '2 sábados por mês' },
  { value: '1_domingo_do_mes', label: '1º domingo do mês' },
  { value: '2_domingo_do_mes', label: '2º domingo do mês' },
  { value: '3_domingo_do_mes', label: '3º domingo do mês' },
  { value: 'ultimo_domingo_mes', label: 'Último domingo do mês' },
  { value: '1_sabado_do_mes', label: '1º sábado do mês' },
  { value: '2_sabado_do_mes', label: '2º sábado do mês' },
  { value: '3_sabado_do_mes', label: '3º sábado do mês' },
  { value: 'ultimo_sabado_mes', label: 'Último sábado do mês' },
];

const toTimeInputValue = (value: string) => value.slice(0, 5);
const toTimeApiValue = (value: string) => (value.length === 5 ? `${value}:00` : value);

function calcTotalHours(start: string, end: string): string {
  const [sh, sm] = start.slice(0, 5).split(':').map(Number);
  const [eh, em] = end.slice(0, 5).split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '--:--';
  let totalMin = eh * 60 + em - (sh * 60 + sm);
  if (totalMin < 0) totalMin += 24 * 60;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toFormData(data: Turno | null): TurnoInput {
  if (!data) return { ...emptyFormData };
  return {
    id: data.id,
    nome: data.nome,
    horaInicio: data.horaInicio,
    horaFim: data.horaFim,
    diasSemana: { ...createEmptyWeekdayFlags(), ...data.diasSemana },
    pessoasPorDia: { ...createEmptyPeoplePerDay(), ...data.pessoasPorDia },
    cor: data.cor,
    sigla: data.sigla,
    folgasPorSemana: data.folgasPorSemana,
    folgaEspecial: data.folgaEspecial,
    descricao: data.descricao,
    diasTrabalhados: data.diasTrabalhados,
  };
}

/** Fields of the Turno cadastro, rendered inside a `RecordFormPage`. */
export const TurnoFormBody = ({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<Turno, TurnoInput>) => {
  const { t } = useLanguage();
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('turno');
  const [formData, setFormData] = useState<TurnoInput>(() => toFormData(data));
  const [traducoes, setTraducoes] = useState<Traducoes>(() => (data?.traducoes as Traducoes) ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeDaysCount = useMemo(
    () => displayOrder.filter((key) => formData.diasSemana[key]).length,
    [formData.diasSemana],
  );

  const totalHours = useMemo(
    () => calcTotalHours(formData.horaInicio, formData.horaFim),
    [formData.horaInicio, formData.horaFim],
  );

  const handleDayToggle = (key: WeekdayKey, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      diasSemana: { ...prev.diasSemana, [key]: checked },
      pessoasPorDia: { ...prev.pessoasPorDia, [key]: checked ? prev.pessoasPorDia[key] : 0 },
    }));
  };

  const handlePeopleChange = (key: WeekdayKey, raw: string) => {
    const n = raw === '' ? 0 : Number(raw);
    setFormData((prev) => ({
      ...prev,
      pessoasPorDia: {
        ...prev.pessoasPorDia,
        [key]: Number.isFinite(n) && n >= 0 ? n : 0,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly) return;
    if (
      !validate(
        {
          sigla: formData.sigla,
          nome: formData.nome,
          cor: formData.cor,
          horaInicio: formData.horaInicio,
          horaFim: formData.horaFim,
          diasSemana: displayOrder.filter((key) => formData.diasSemana[key]),
          diasTrabalhados: formData.diasTrabalhados,
          folgasPorSemana: formData.folgasPorSemana,
          folgaEspecial: formData.folgaEspecial,
          descricao: formData.descricao,
        },
        { descricao: t('common.description') },
      )
    )
      return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        nome: formData.nome.trim(),
        sigla: formData.sigla?.trim() || '',
        descricao: formData.descricao?.trim() || '',
        folgaEspecial: formData.folgaEspecial || '',
        horaInicio: toTimeApiValue(formData.horaInicio),
        horaFim: toTimeApiValue(formData.horaFim),
        traducoes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!data?.id;
  const dataCadastro = data?.dataCadastro;
  const usuarioCadastro = data?.usuarioCadastro;

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
          <TabsTrigger value="traducao">Tradução</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4 mt-4">
          <ConfigurableFieldGrid>
            <div className="space-y-2" {...fieldLayout('sigla')}>
              <Label htmlFor="turno-sigla">
                {fieldLabel('sigla', 'Sigla')}
                <FieldAsterisk type={getAsterisk('sigla')} />
              </Label>
              <Input
                id="turno-sigla"
                value={formData.sigla || ''}
                onChange={(e) => setFormData((p) => ({ ...p, sigla: e.target.value }))}
                maxLength={10}
                disabled={readOnly || isSubmitting}
              />
            </div>
            <div className="space-y-2" {...fieldLayout('nome')}>
              <Label htmlFor="turno-nome">
                {fieldLabel('nome', 'Nome do Turno')}
                <FieldAsterisk type={getAsterisk('nome', true)} />
              </Label>
              <Input
                id="turno-nome"
                value={formData.nome}
                onChange={(e) => setFormData((p) => ({ ...p, nome: e.target.value }))}
                maxLength={120}
                required
                disabled={readOnly || isSubmitting}
              />
            </div>

            <div className="space-y-2" {...fieldLayout('cor')}>
              <Label>
                {fieldLabel('cor', 'Cor')}
                <FieldAsterisk type={getAsterisk('cor')} />
              </Label>
              <ColorPicker
                value={formData.cor}
                onChange={(cor) => setFormData((p) => ({ ...p, cor }))}
                disabled={readOnly || isSubmitting}
                previewLabel={formData.nome}
              />
            </div>

            <div className="space-y-2" {...fieldLayout('horaInicio')}>
              <Label htmlFor="turno-inicio">
                {fieldLabel('horaInicio', 'Início do Turno')}
                <FieldAsterisk type={getAsterisk('horaInicio', true)} />
              </Label>
              <Input
                id="turno-inicio"
                type="time"
                value={toTimeInputValue(formData.horaInicio)}
                onChange={(e) => setFormData((p) => ({ ...p, horaInicio: e.target.value }))}
                required
                disabled={readOnly || isSubmitting}
              />
            </div>
            <div className="space-y-2" {...fieldLayout('horaFim')}>
              <Label htmlFor="turno-fim">
                {fieldLabel('horaFim', 'Fim do Turno')}
                <FieldAsterisk type={getAsterisk('horaFim', true)} />
              </Label>
              <Input
                id="turno-fim"
                type="time"
                value={toTimeInputValue(formData.horaFim)}
                onChange={(e) => setFormData((p) => ({ ...p, horaFim: e.target.value }))}
                required
                disabled={readOnly || isSubmitting}
              />
            </div>
            <div className="space-y-2" {...fieldLayout('totalHoras')}>
              <Label>{fieldLabel('totalHoras', 'Total de Horas')}</Label>
              <Input value={totalHours} readOnly className="bg-muted font-mono" />
            </div>

            <div className="space-y-2" {...fieldLayout('diasSemana')}>
              <Label>
                {fieldLabel('diasSemana', 'Dias da Semana e Pessoas por Dia')}
                <FieldAsterisk type={getAsterisk('diasSemana')} />
              </Label>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40">
                      {displayOrder.map((key) => (
                        <th
                          key={key}
                          className="text-center font-medium py-2 px-1 text-muted-foreground"
                        >
                          {dayLabels[key]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Checkboxes row */}
                    <tr className="border-t">
                      {displayOrder.map((key) => (
                        <td key={key} className="text-center py-2 px-1">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={formData.diasSemana[key]}
                              onCheckedChange={(checked) => handleDayToggle(key, !!checked)}
                              disabled={readOnly || isSubmitting}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                    {/* People per day row */}
                    <tr className="border-t bg-muted/10">
                      {displayOrder.map((key) => (
                        <td key={key} className="text-center py-2 px-1">
                          <Input
                            type="number"
                            min={0}
                            value={formData.pessoasPorDia[key]}
                            onChange={(e) => handlePeopleChange(key, e.target.value)}
                            disabled={readOnly || isSubmitting || !formData.diasSemana[key]}
                            className="h-8 text-center px-1"
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2" {...fieldLayout('diasTrabalhados')}>
              <Label htmlFor="turno-dias-trabalhados">
                {fieldLabel('diasTrabalhados', 'Dias Trabalhados')}
                <FieldAsterisk type={getAsterisk('diasTrabalhados')} />
              </Label>
              <Input
                id="turno-dias-trabalhados"
                type="number"
                min={0}
                max={7}
                value={formData.diasTrabalhados ?? ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    diasTrabalhados: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                placeholder={String(activeDaysCount)}
                disabled={readOnly || isSubmitting}
              />
            </div>
            <div className="space-y-2" {...fieldLayout('folgasPorSemana')}>
              <Label htmlFor="turno-folgas">
                {fieldLabel('folgasPorSemana', 'Folgas por Semana')}
                <FieldAsterisk type={getAsterisk('folgasPorSemana')} />
              </Label>
              <Input
                id="turno-folgas"
                type="number"
                min={0}
                max={7}
                value={formData.folgasPorSemana}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, folgasPorSemana: Number(e.target.value || 0) }))
                }
                disabled={readOnly || isSubmitting}
              />
            </div>

            <div className="rounded-md border p-4 space-y-3" {...fieldLayout('folgaEspecial')}>
              <Label className="text-xs font-medium">
                {fieldLabel('folgaEspecial', 'Folga Especial')}
                <FieldAsterisk type={getAsterisk('folgaEspecial')} />
              </Label>
              <RadioGroup
                value={formData.folgaEspecial || ''}
                onValueChange={(value) =>
                  setFormData((p) => ({
                    ...p,
                    folgaEspecial: value === p.folgaEspecial ? '' : value,
                  }))
                }
                disabled={readOnly || isSubmitting}
                className="grid grid-cols-3 gap-x-6 gap-y-2"
              >
                {FOLGA_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={opt.value}
                      id={`folga-${opt.value}`}
                      onClick={() => {
                        if (formData.folgaEspecial === opt.value) {
                          setFormData((p) => ({ ...p, folgaEspecial: '' }));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`folga-${opt.value}`}
                      className="font-normal cursor-pointer text-xs"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2" {...fieldLayout('descricao')}>
              <Label htmlFor="turno-descricao">
                {fieldLabel('descricao', t('common.description'))}
                <FieldAsterisk type={getAsterisk('descricao')} />
              </Label>
              <Textarea
                id="turno-descricao"
                rows={3}
                placeholder="Descrição do turno"
                value={formData.descricao || ''}
                onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                disabled={readOnly || isSubmitting}
              />
            </div>
          </ConfigurableFieldGrid>

          {/* Usuário/Data Cadastro — only in edit mode */}
          {isEditing && (usuarioCadastro || dataCadastro) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Usuário de Cadastro</Label>
                <Input value={usuarioCadastro || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Data de Cadastro</Label>
                <Input
                  value={dataCadastro ? new Date(dataCadastro).toLocaleDateString('pt-BR') : ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="traducao">
          <TraducaoTab
            traducoes={traducoes}
            onChange={(lang, value) => setTraducoes({ ...traducoes, [lang]: value })}
            readOnly={readOnly}
          />
        </TabsContent>
      </Tabs>
    </form>
  );
};
