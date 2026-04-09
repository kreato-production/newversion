import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TurnoInput, WeekdayKey } from '@/modules/turnos/turnos.types';
import { createEmptyPeoplePerDay, createEmptyWeekdayFlags } from '@/modules/turnos/turnos.types';

interface TurnoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TurnoInput) => void | Promise<void>;
  data?: TurnoInput | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
  dataCadastro?: string;
  usuarioCadastro?: string;
}

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

export const TurnoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
  dataCadastro,
  usuarioCadastro,
}: TurnoFormModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<TurnoInput>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const corInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(
      data
        ? {
            ...data,
            diasSemana: { ...createEmptyWeekdayFlags(), ...data.diasSemana },
            pessoasPorDia: { ...createEmptyPeoplePerDay(), ...data.pessoasPorDia },
          }
        : { ...emptyFormData },
    );
    setIsSubmitting(false);
  }, [isOpen, data]);

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
    if (readOnly) {
      onClose();
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        nome: formData.nome.trim(),
        sigla: formData.sigla?.trim() || '',
        descricao: formData.descricao?.trim() || '',
        folgaEspecial: formData.folgaEspecial || '',
        horaInicio: toTimeApiValue(formData.horaInicio),
        horaFim: toTimeApiValue(formData.horaFim),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!data?.id;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent className="w-[960px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('turns.edit') : t('turns.new')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('turns.editDescription') : t('turns.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Sigla | Nome | Cor */}
          <div className="flex gap-3 items-end">
            <div className="space-y-2 w-24 shrink-0">
              <Label htmlFor="turno-sigla">Sigla</Label>
              <Input
                id="turno-sigla"
                value={formData.sigla || ''}
                onChange={(e) => setFormData((p) => ({ ...p, sigla: e.target.value }))}
                maxLength={10}
                disabled={readOnly || isSubmitting}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="turno-nome">
                Nome do Turno <span className="text-destructive">*</span>
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
            <div className="space-y-2 shrink-0">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={corInputRef}
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData((p) => ({ ...p, cor: e.target.value }))}
                  disabled={readOnly || isSubmitting}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => corInputRef.current?.click()}
                  disabled={readOnly || isSubmitting}
                  className="h-10 w-16 rounded border border-input cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: formData.cor }}
                  aria-label="Selecionar cor"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Início | Fim | Total */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="turno-inicio">Início do Turno</Label>
              <Input
                id="turno-inicio"
                type="time"
                value={toTimeInputValue(formData.horaInicio)}
                onChange={(e) => setFormData((p) => ({ ...p, horaInicio: e.target.value }))}
                required
                disabled={readOnly || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turno-fim">Fim do Turno</Label>
              <Input
                id="turno-fim"
                type="time"
                value={toTimeInputValue(formData.horaFim)}
                onChange={(e) => setFormData((p) => ({ ...p, horaFim: e.target.value }))}
                required
                disabled={readOnly || isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>Total de Horas</Label>
              <Input value={totalHours} readOnly className="bg-muted font-mono" />
            </div>
          </div>

          {/* Days grid */}
          <div className="space-y-2">
            <Label>Dias da Semana e Pessoas por Dia</Label>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
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

          {/* Dias Trabalhados | Folgas por Semana */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="turno-dias-trabalhados">Dias Trabalhados</Label>
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
            <div className="space-y-2">
              <Label htmlFor="turno-folgas">Folgas por Semana</Label>
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
          </div>

          {/* Folga Especial */}
          <div className="rounded-md border p-4 space-y-3">
            <Label className="text-sm font-medium">Folga Especial</Label>
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
                    className="font-normal cursor-pointer text-sm"
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="turno-descricao">{t('common.description')}</Label>
            <Textarea
              id="turno-descricao"
              rows={3}
              placeholder="Descrição do turno"
              value={formData.descricao || ''}
              onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
              disabled={readOnly || isSubmitting}
            />
          </div>

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

          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {readOnly ? t('common.close') : t('common.cancel')}
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.nome.trim() ||
                    !formData.horaInicio ||
                    !formData.horaFim
                  }
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.save')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
