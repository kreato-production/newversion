import { useEffect, useState } from 'react';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, es, ptBR } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  FieldAsterisk,
  useFormFieldConfig,
  ConfigurableFieldGrid,
} from '@/hooks/useFormFieldConfig';
import {
  ApiTarefasRepository,
  type Tarefa,
  type TarefaGravacao,
  type TarefaRecursoHumano,
  type TarefaStatus,
} from '@/modules/tarefas/tarefas.api';

const tarefasRepository = new ApiTarefasRepository();

interface TarefaFormBodyProps extends RecordFormBodyProps<Tarefa, Tarefa> {
  /** Deletes the task (edit mode, with confirmation); omitted when not allowed. */
  onDelete?: () => void;
}

/**
 * Fields of the Tarefa cadastro (with per-field permissions), inside a `RecordFormPage`.
 * Loads its own options (status, gravações, recursos humanos).
 */
export const TarefaFormBody = ({
  formId,
  data,
  readOnly: globalReadOnly,
  onSubmit,
  onDelete,
}: TarefaFormBodyProps) => {
  const { t, language } = useLanguage();
  const { isReadOnly, isVisible } = usePermissions();
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('tarefa');
  const [formData, setFormData] = useState<Partial<Tarefa>>(() =>
    data ? { ...data, recursoHumanoId: data.recursoHumanoId || '' } : {},
  );
  const [statusList, setStatusList] = useState<TarefaStatus[]>([]);
  const [gravacoes, setGravacoes] = useState<TarefaGravacao[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<TarefaRecursoHumano[]>([]);

  useEffect(() => {
    tarefasRepository
      .listOptions()
      .then((options) => {
        setStatusList(options.statusList);
        setGravacoes(options.gravacoes);
        setRecursosHumanos(options.recursosHumanos);
        // New task: start with the initial status once the statuses are known.
        if (!data) {
          const initialStatus =
            options.statusList.find((item) => item.is_inicial) ||
            options.statusList.find((item) => item.codigo === 'PEND') ||
            options.statusList[0];
          // The status select may already have written '' before the options arrived,
          // so the initial status wins over an empty value, not only over a missing one.
          setFormData((current) => ({
            prioridade: 'media',
            dataCriacao: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
            recursoHumanoId: '',
            ...current,
            statusId: current.statusId || initialStatus?.id,
          }));
        }
      })
      .catch((error) => console.error('Error loading tarefa options:', error));
  }, [data]);

  const localeMap = { pt: ptBR, en: enUS, es };

  const isTituloReadOnly =
    globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Título da Tarefa');
  const isDescricaoReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Descrição');
  const isGravacaoReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Gravação');
  const isStatusReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Status');
  const isResponsavelReadOnly =
    globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Responsável');
  const isPrioridadeReadOnly =
    globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Prioridade');
  const isDataInicioReadOnly =
    globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Data Início');
  const isDataLimiteReadOnly =
    globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Data Limite');
  const isHoraInicioReadOnly =
    globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Hora Início');
  const isHoraFimReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Hora Fim');
  const isObservacoesReadOnly =
    globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Observações');

  const showTitulo = isVisible('Produção', 'Tarefas', '-', 'Título da Tarefa');
  const showDescricao = isVisible('Produção', 'Tarefas', '-', 'Descrição');
  const showGravacao = isVisible('Produção', 'Tarefas', '-', 'Gravação');
  const showStatus = isVisible('Produção', 'Tarefas', '-', 'Status');
  const showResponsavel = isVisible('Produção', 'Tarefas', '-', 'Responsável');
  const showPrioridade = isVisible('Produção', 'Tarefas', '-', 'Prioridade');
  const showDataInicio = isVisible('Produção', 'Tarefas', '-', 'Data Início');
  const showDataLimite = isVisible('Produção', 'Tarefas', '-', 'Data Limite');
  const showHoraInicio = isVisible('Produção', 'Tarefas', '-', 'Hora Início');
  const showHoraFim = isVisible('Produção', 'Tarefas', '-', 'Hora Fim');
  const showObservacoes = isVisible('Produção', 'Tarefas', '-', 'Observações');

  const updateField = (field: keyof Tarefa, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (globalReadOnly) return;

    // Only the fields the user can see are checked: a hidden field cannot be filled in.
    const values: Record<string, unknown> = {};
    if (showTitulo) values.titulo = formData.titulo;
    if (showDescricao) values.descricao = formData.descricao;
    if (showGravacao) values.gravacaoId = formData.gravacaoId;
    if (showStatus) values.statusId = formData.statusId;
    if (showResponsavel) values.recursoHumanoId = formData.recursoHumanoId;
    if (showPrioridade) values.prioridade = formData.prioridade;
    if (showDataInicio) values.dataInicio = formData.dataInicio;
    if (showDataLimite) values.dataFim = formData.dataFim;
    if (showObservacoes) values.observacoes = formData.observacoes;
    if (!validate(values)) return;

    const recurso = recursosHumanos.find((item) => item.id === formData.recursoHumanoId);
    void onSubmit({
      ...formData,
      recursoHumanoNome: recurso?.nome,
    } as Tarefa);
  };

  const formatDateLabel = (value?: string) => {
    if (!value) {
      return t('common.select');
    }

    return format(new Date(`${value}T00:00:00`), 'PPP', { locale: localeMap[language] });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <ConfigurableFieldGrid>
        {showTitulo && (
          <div className="space-y-1.5" {...fieldLayout('titulo')}>
            <Label htmlFor="titulo">
              {fieldLabel('titulo', t('tasks.taskTitle'))}{' '}
              <FieldAsterisk type={getAsterisk('titulo', true)} />
            </Label>
            <Input
              id="titulo"
              value={formData.titulo || ''}
              onChange={(event) => updateField('titulo', event.target.value)}
              placeholder={t('tasks.taskTitlePlaceholder')}
              required={!isTituloReadOnly}
              disabled={isTituloReadOnly}
              className={isTituloReadOnly ? 'bg-muted' : ''}
            />
          </div>
        )}

        {showDescricao && (
          <div className="space-y-1.5" {...fieldLayout('descricao')}>
            <Label htmlFor="descricao">
              {fieldLabel('descricao', t('tasks.taskDescription'))}{' '}
              <FieldAsterisk type={getAsterisk('descricao')} />
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao || ''}
              onChange={(event) => updateField('descricao', event.target.value)}
              placeholder={t('tasks.taskDescriptionPlaceholder')}
              rows={3}
              disabled={isDescricaoReadOnly}
              className={isDescricaoReadOnly ? 'bg-muted' : ''}
            />
          </div>
        )}

        {showGravacao && (
          <div className="space-y-1.5" {...fieldLayout('gravacaoId')}>
            <Label>
              {fieldLabel('gravacaoId', t('tasks.recording'))}{' '}
              <FieldAsterisk type={getAsterisk('gravacaoId')} />
            </Label>
            {isGravacaoReadOnly ? (
              <Input
                value={gravacoes.find((item) => item.id === formData.gravacaoId)?.nome || '-'}
                disabled
                className="bg-muted"
              />
            ) : (
              <Select
                value={formData.gravacaoId || ''}
                onValueChange={(value) => updateField('gravacaoId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  {gravacoes.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {showStatus && (
          <div className="space-y-1.5" {...fieldLayout('statusId')}>
            <Label>
              {fieldLabel('statusId', t('tasks.status'))}{' '}
              <FieldAsterisk type={getAsterisk('statusId')} />
            </Label>
            {isStatusReadOnly ? (
              <Input
                value={statusList.find((item) => item.id === formData.statusId)?.nome || '-'}
                disabled
                className="bg-muted"
              />
            ) : (
              <Select
                value={formData.statusId || ''}
                // Radix emits '' while the options are still loading; a user never picks
                // an empty status, so ignore it instead of wiping the initial status.
                onValueChange={(value) => {
                  if (value) updateField('statusId', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  {statusList.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.cor || '#888' }}
                        />
                        {status.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {showResponsavel && (
          <div className="space-y-1.5" {...fieldLayout('recursoHumanoId')}>
            <Label>
              {fieldLabel('recursoHumanoId', t('tasks.assignee'))}{' '}
              <FieldAsterisk type={getAsterisk('recursoHumanoId')} />
            </Label>
            {isResponsavelReadOnly ? (
              <Input
                value={
                  recursosHumanos.find((item) => item.id === formData.recursoHumanoId)?.nome ||
                  formData.recursoHumanoNome ||
                  '-'
                }
                disabled
                className="bg-muted"
              />
            ) : (
              <Select
                value={formData.recursoHumanoId || ''}
                onValueChange={(value) => updateField('recursoHumanoId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  {recursosHumanos.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nome}
                      {item.status === 'Inativo' ? ' (Inativo)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {showPrioridade && (
          <div className="space-y-1.5" {...fieldLayout('prioridade')}>
            <Label>
              {fieldLabel('prioridade', t('tasks.priority'))}{' '}
              <FieldAsterisk type={getAsterisk('prioridade')} />
            </Label>
            {isPrioridadeReadOnly ? (
              <Input
                value={
                  formData.prioridade === 'alta'
                    ? t('tasks.priorityHigh')
                    : formData.prioridade === 'media'
                      ? t('tasks.priorityMedium')
                      : t('tasks.priorityLow')
                }
                disabled
                className="bg-muted"
              />
            ) : (
              <Select
                value={formData.prioridade || 'media'}
                onValueChange={(value) => updateField('prioridade', value as Tarefa['prioridade'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">{t('tasks.priorityLow')}</SelectItem>
                  <SelectItem value="media">{t('tasks.priorityMedium')}</SelectItem>
                  <SelectItem value="alta">{t('tasks.priorityHigh')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {showDataInicio && (
          <div className="space-y-1.5" {...fieldLayout('dataInicio')}>
            <Label>
              {fieldLabel('dataInicio', t('tasks.startDate'))}{' '}
              <FieldAsterisk type={getAsterisk('dataInicio')} />
            </Label>
            {isDataInicioReadOnly ? (
              <Input
                value={formData.dataInicio ? formatDateLabel(formData.dataInicio) : '-'}
                disabled
                className="bg-muted"
              />
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.dataInicio && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateLabel(formData.dataInicio)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.dataInicio ? new Date(`${formData.dataInicio}T00:00:00`) : undefined
                    }
                    onSelect={(date) =>
                      updateField('dataInicio', date ? date.toISOString().slice(0, 10) : '')
                    }
                    locale={localeMap[language]}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}

        {showDataLimite && (
          <div className="space-y-1.5" {...fieldLayout('dataFim')}>
            <Label>
              {fieldLabel('dataFim', t('tasks.dueDate'))}{' '}
              <FieldAsterisk type={getAsterisk('dataFim')} />
            </Label>
            {isDataLimiteReadOnly ? (
              <Input
                value={formData.dataFim ? formatDateLabel(formData.dataFim) : '-'}
                disabled
                className="bg-muted"
              />
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.dataFim && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateLabel(formData.dataFim)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      formData.dataFim ? new Date(`${formData.dataFim}T00:00:00`) : undefined
                    }
                    onSelect={(date) =>
                      updateField('dataFim', date ? date.toISOString().slice(0, 10) : '')
                    }
                    locale={localeMap[language]}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}

        {showHoraInicio && (
          <div className="space-y-1.5" {...fieldLayout('horaInicio')}>
            <Label htmlFor="horaInicio">{fieldLabel('horaInicio', t('common.startTime'))}</Label>
            <Input
              id="horaInicio"
              type="time"
              value={formData.horaInicio || ''}
              onChange={(event) => updateField('horaInicio', event.target.value)}
              disabled={isHoraInicioReadOnly}
              className={isHoraInicioReadOnly ? 'bg-muted' : ''}
            />
          </div>
        )}

        {showHoraFim && (
          <div className="space-y-1.5" {...fieldLayout('horaFim')}>
            <Label htmlFor="horaFim">{fieldLabel('horaFim', t('common.endTime'))}</Label>
            <Input
              id="horaFim"
              type="time"
              value={formData.horaFim || ''}
              onChange={(event) => updateField('horaFim', event.target.value)}
              disabled={isHoraFimReadOnly}
              className={isHoraFimReadOnly ? 'bg-muted' : ''}
            />
          </div>
        )}

        {showObservacoes && (
          <div className="space-y-1.5" {...fieldLayout('observacoes')}>
            <Label htmlFor="observacoes">
              {fieldLabel('observacoes', t('common.observations'))}{' '}
              <FieldAsterisk type={getAsterisk('observacoes')} />
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(event) => updateField('observacoes', event.target.value)}
              placeholder={`${t('common.observations')}...`}
              rows={2}
              disabled={isObservacoesReadOnly}
              className={isObservacoesReadOnly ? 'bg-muted' : ''}
            />
          </div>
        )}
      </ConfigurableFieldGrid>

      {onDelete && !globalReadOnly && (
        <div className="flex justify-start pt-2 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('common.confirm.delete')}</AlertDialogTitle>
                <AlertDialogDescription>{t('tasks.deleteConfirmation')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </form>
  );
};
