import { useEffect, useRef, useState } from 'react';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { FieldAsterisk, useFormFieldConfig } from '@/hooks/useFormFieldConfig';
import type {
  Tarefa,
  TarefaGravacao,
  TarefaRecursoHumano,
  TarefaStatus,
} from '@/modules/tarefas/tarefas.api';

interface TarefaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Tarefa) => void;
  onDelete?: () => void;
  data?: Tarefa | null;
  statusList: TarefaStatus[];
  gravacoes: TarefaGravacao[];
  recursosHumanos: TarefaRecursoHumano[];
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

export const TarefaFormModal = ({
  open,
  onOpenChange,
  onSave,
  onDelete,
  data,
  statusList,
  gravacoes,
  recursosHumanos,
  readOnly: globalReadOnly = false,
  navigation,
}: TarefaFormModalProps) => {
  const { t, language } = useLanguage();
  const { isReadOnly, isVisible } = usePermissions();
  const { getAsterisk } = useFormFieldConfig('tarefa');
  const [formData, setFormData] = useState<Partial<Tarefa>>({});
  const initializedForRef = useRef<string | null>(null);

  const localeMap = { pt: ptBR, en: enUS, es };

  const isTituloReadOnly =
    globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'TÃ­tulo da Tarefa');
  const isDescricaoReadOnly =
    globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'DescriÃ§Ã£o');
  const isGravacaoReadOnly =
    globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'GravaÃ§Ã£o');
  const isStatusReadOnly = globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'Status');
  const isResponsavelReadOnly =
    globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'ResponsÃ¡vel');
  const isPrioridadeReadOnly =
    globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'Prioridade');
  const isDataInicioReadOnly =
    globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'Data InÃ­cio');
  const isDataLimiteReadOnly =
    globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'Data Limite');
  const isHoraInicioReadOnly =
    globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'Hora InÃ­cio');
  const isHoraFimReadOnly = globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'Hora Fim');
  const isObservacoesReadOnly =
    globalReadOnly || isReadOnly('ProduÃ§Ã£o', 'Tarefas', '-', 'ObservaÃ§Ãµes');

  const showTitulo = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'TÃ­tulo da Tarefa');
  const showDescricao = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'DescriÃ§Ã£o');
  const showGravacao = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'GravaÃ§Ã£o');
  const showStatus = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'Status');
  const showResponsavel = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'ResponsÃ¡vel');
  const showPrioridade = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'Prioridade');
  const showDataInicio = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'Data InÃ­cio');
  const showDataLimite = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'Data Limite');
  const showHoraInicio = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'Hora InÃ­cio');
  const showHoraFim = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'Hora Fim');
  const showObservacoes = isVisible('ProduÃ§Ã£o', 'Tarefas', '-', 'ObservaÃ§Ãµes');

  useEffect(() => {
    if (!open) {
      initializedForRef.current = null;
      return;
    }

    const dataId = data?.id || '__new__';
    if (initializedForRef.current === dataId) {
      return;
    }

    initializedForRef.current = dataId;

    if (data) {
      setFormData({
        ...data,
        recursoHumanoId: data.recursoHumanoId || '',
      });
      return;
    }

    const initialStatus =
      statusList.find((item) => item.is_inicial) ||
      statusList.find((item) => item.codigo === 'PEND') ||
      statusList[0];
    setFormData({
      prioridade: 'media',
      statusId: initialStatus?.id,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      recursoHumanoId: '',
    });
  }, [data, open, statusList]);

  const updateField = (field: keyof Tarefa, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const recurso = recursosHumanos.find((item) => item.id === formData.recursoHumanoId);
    onSave({
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? t('tasks.edit') : t('tasks.new')}</DialogTitle>
          <DialogDescription>{t('tasks.formDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {showTitulo && (
            <div className="space-y-2">
              <Label htmlFor="titulo">
                {t('tasks.taskTitle')} <FieldAsterisk type={getAsterisk('titulo')} />
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
            <div className="space-y-2">
              <Label htmlFor="descricao">
                {t('tasks.taskDescription')} <FieldAsterisk type={getAsterisk('descricao')} />
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

          <div className="grid grid-cols-2 gap-4">
            {showGravacao && (
              <div className="space-y-2">
                <Label>
                  {t('tasks.recording')} <FieldAsterisk type={getAsterisk('gravacaoId')} />
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
              <div className="space-y-2">
                <Label>
                  {t('tasks.status')} <FieldAsterisk type={getAsterisk('statusId')} />
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
                    onValueChange={(value) => updateField('statusId', value)}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            {showResponsavel && (
              <div className="space-y-2">
                <Label>
                  {t('tasks.assignee')} <FieldAsterisk type={getAsterisk('recursoHumanoId')} />
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
              <div className="space-y-2">
                <Label>
                  {t('tasks.priority')} <FieldAsterisk type={getAsterisk('prioridade')} />
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
                    onValueChange={(value) =>
                      updateField('prioridade', value as Tarefa['prioridade'])
                    }
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            {showDataInicio && (
              <div className="space-y-2">
                <Label>
                  {t('tasks.startDate')} <FieldAsterisk type={getAsterisk('dataInicio')} />
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
                          formData.dataInicio
                            ? new Date(`${formData.dataInicio}T00:00:00`)
                            : undefined
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
              <div className="space-y-2">
                <Label>
                  {t('tasks.dueDate')} <FieldAsterisk type={getAsterisk('dataFim')} />
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
              <div className="space-y-2">
                <Label htmlFor="horaInicio">{t('common.startTime')}</Label>
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
              <div className="space-y-2">
                <Label htmlFor="horaFim">{t('common.endTime')}</Label>
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
          </div>

          {showObservacoes && (
            <div className="space-y-2">
              <Label htmlFor="observacoes">
                {t('common.observations')} <FieldAsterisk type={getAsterisk('observacoes')} />
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

          <DialogFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              {navigation && <ModalNavigation {...navigation} />}
              {onDelete && !globalReadOnly && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('common.confirm.delete')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('tasks.deleteConfirmation')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>{t('common.delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {globalReadOnly ? t('common.close') : t('common.cancel')}
              </Button>
              {!globalReadOnly && (
                <Button type="submit" className="gradient-primary">
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
