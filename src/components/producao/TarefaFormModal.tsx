import { useState, useEffect, useCallback } from 'react';
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
import { ptBR, enUS, es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Tarefa {
  id: string;
  gravacaoId: string;
  recursoHumanoId: string;
  recursoHumanoNome?: string;
  recursoTecnicoId?: string;
  recursoTecnicoNome?: string;
  titulo: string;
  descricao: string;
  statusId: string;
  prioridade: 'baixa' | 'media' | 'alta';
  dataInicio: string;
  dataFim: string;
  dataCriacao: string;
  dataAtualizacao: string;
  observacoes?: string;
}

interface StatusTarefa {
  id: string;
  codigo: string;
  nome: string;
  cor?: string;
}

interface Gravacao {
  id: string;
  nome: string;
}

interface RecursoHumano {
  id: string;
  nome: string;
  nomeTrabalho?: string;
}

interface TarefaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Tarefa) => void;
  onDelete?: () => void;
  data?: Tarefa | null;
  statusList: StatusTarefa[];
  gravacoes: Gravacao[];
  /** Se true, todos os campos ficam em somente leitura (usuário sem permissão de alterar) */
  readOnly?: boolean;
}

export const TarefaFormModal = ({
  open,
  onOpenChange,
  onSave,
  onDelete,
  data,
  statusList,
  gravacoes,
  readOnly: globalReadOnly = false,
}: TarefaFormModalProps) => {
  const { t, language } = useLanguage();
  const { session } = useAuth();
  const { isReadOnly, isVisible } = usePermissions();
  const [formData, setFormData] = useState<Partial<Tarefa>>({});
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);

  const localeMap = { pt: ptBR, en: enUS, es: es };

  // Verificar permissões de campos (somente leitura por campo ou global)
  const isTituloReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Título da Tarefa');
  const isDescricaoReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Descrição');
  const isGravacaoReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Gravação');
  const isStatusReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Status');
  const isResponsavelReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Responsável');
  const isPrioridadeReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Prioridade');
  const isDataInicioReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Data Início');
  const isDataLimiteReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Data Limite');
  const isObservacoesReadOnly = globalReadOnly || isReadOnly('Produção', 'Tarefas', '-', 'Observações');

  // Verificar visibilidade dos campos
  const showTitulo = isVisible('Produção', 'Tarefas', '-', 'Título da Tarefa');
  const showDescricao = isVisible('Produção', 'Tarefas', '-', 'Descrição');
  const showGravacao = isVisible('Produção', 'Tarefas', '-', 'Gravação');
  const showStatus = isVisible('Produção', 'Tarefas', '-', 'Status');
  const showResponsavel = isVisible('Produção', 'Tarefas', '-', 'Responsável');
  const showPrioridade = isVisible('Produção', 'Tarefas', '-', 'Prioridade');
  const showDataInicio = isVisible('Produção', 'Tarefas', '-', 'Data Início');
  const showDataLimite = isVisible('Produção', 'Tarefas', '-', 'Data Limite');
  const showObservacoes = isVisible('Produção', 'Tarefas', '-', 'Observações');

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        prioridade: 'media',
        statusId: statusList.find(s => s.codigo === 'PEND')?.id || statusList[0]?.id,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
      });
    }
  }, [data, statusList]);

  const fetchRecursosHumanos = useCallback(async () => {
    if (!session) return;

    try {
      const { data: rhData } = await supabase
        .from('recursos_humanos')
        .select('id, nome, sobrenome')
        .eq('status', 'Ativo')
        .order('nome');

      setRecursosHumanos((rhData || []).map((r: any) => ({
        id: r.id,
        nome: `${r.nome} ${r.sobrenome}`.trim(),
      })));
    } catch (err) {
      console.error('Error fetching recursos humanos:', err);
    }
  }, [session]);

  useEffect(() => {
    if (open) {
      fetchRecursosHumanos();
    }
  }, [open, fetchRecursosHumanos]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recurso = recursosHumanos.find(r => r.id === formData.recursoHumanoId);
    
    onSave({
      ...formData,
      recursoHumanoNome: recurso?.nomeTrabalho || recurso?.nome,
    } as Tarefa);
  };

  const updateField = (field: keyof Tarefa, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? t('tasks.edit') : t('tasks.new')}</DialogTitle>
          <DialogDescription>
            {t('tasks.formDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          {showTitulo && (
            <div className="space-y-2">
              <Label htmlFor="titulo">{t('tasks.taskTitle')} *</Label>
              <Input
                id="titulo"
                value={formData.titulo || ''}
                onChange={(e) => updateField('titulo', e.target.value)}
                placeholder={t('tasks.taskTitlePlaceholder')}
                required={!isTituloReadOnly}
                disabled={isTituloReadOnly}
                className={isTituloReadOnly ? 'bg-muted' : ''}
              />
            </div>
          )}

          {/* Description */}
          {showDescricao && (
            <div className="space-y-2">
              <Label htmlFor="descricao">{t('tasks.taskDescription')}</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => updateField('descricao', e.target.value)}
                placeholder={t('tasks.taskDescriptionPlaceholder')}
                rows={3}
                disabled={isDescricaoReadOnly}
                className={isDescricaoReadOnly ? 'bg-muted' : ''}
              />
            </div>
          )}

          {/* Recording & Status */}
          <div className="grid grid-cols-2 gap-4">
            {showGravacao && (
              <div className="space-y-2">
                <Label>{t('tasks.recording')} *</Label>
                {isGravacaoReadOnly ? (
                  <Input
                    value={gravacoes.find(g => g.id === formData.gravacaoId)?.nome || '-'}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    value={formData.gravacaoId || ''}
                    onValueChange={(value) => updateField('gravacaoId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {gravacoes.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {showStatus && (
              <div className="space-y-2">
                <Label>{t('tasks.status')} *</Label>
                {isStatusReadOnly ? (
                  <Input
                    value={statusList.find(s => s.id === formData.statusId)?.nome || '-'}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    value={formData.statusId || ''}
                    onValueChange={(value) => updateField('statusId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusList.map(status => (
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

          {/* Assignee & Priority */}
          <div className="grid grid-cols-2 gap-4">
            {showResponsavel && (
              <div className="space-y-2">
                <Label>{t('tasks.assignee')} *</Label>
                {isResponsavelReadOnly ? (
                  <Input
                    value={recursosHumanos.find(r => r.id === formData.recursoHumanoId)?.nome || '-'}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    value={formData.recursoHumanoId || ''}
                    onValueChange={(value) => updateField('recursoHumanoId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {recursosHumanos.map(rh => (
                        <SelectItem key={rh.id} value={rh.id}>
                          {rh.nomeTrabalho || rh.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {showPrioridade && (
              <div className="space-y-2">
                <Label>{t('tasks.priority')}</Label>
                {isPrioridadeReadOnly ? (
                  <Input
                    value={formData.prioridade === 'alta' ? t('tasks.priorityHigh') : formData.prioridade === 'media' ? t('tasks.priorityMedium') : t('tasks.priorityLow')}
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Select
                    value={formData.prioridade || 'media'}
                    onValueChange={(value) => updateField('prioridade', value as 'baixa' | 'media' | 'alta')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          {t('tasks.priorityLow')}
                        </div>
                      </SelectItem>
                      <SelectItem value="media">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          {t('tasks.priorityMedium')}
                        </div>
                      </SelectItem>
                      <SelectItem value="alta">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          {t('tasks.priorityHigh')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {showDataInicio && (
              <div className="space-y-2">
                <Label>{t('tasks.startDate')}</Label>
                {isDataInicioReadOnly ? (
                  <Input
                    value={formData.dataInicio 
                      ? format(new Date(formData.dataInicio), 'PPP', { locale: localeMap[language] })
                      : '-'
                    }
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dataInicio && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dataInicio 
                          ? format(new Date(formData.dataInicio), 'PPP', { locale: localeMap[language] })
                          : t('common.select')
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dataInicio ? new Date(formData.dataInicio) : undefined}
                        onSelect={(date) => updateField('dataInicio', date?.toISOString() || '')}
                        locale={localeMap[language]}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}

            {showDataLimite && (
              <div className="space-y-2">
                <Label>{t('tasks.dueDate')}</Label>
                {isDataLimiteReadOnly ? (
                  <Input
                    value={formData.dataFim 
                      ? format(new Date(formData.dataFim), 'PPP', { locale: localeMap[language] })
                      : '-'
                    }
                    disabled
                    className="bg-muted"
                  />
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dataFim && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dataFim 
                          ? format(new Date(formData.dataFim), 'PPP', { locale: localeMap[language] })
                          : t('common.select')
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dataFim ? new Date(formData.dataFim) : undefined}
                        onSelect={(date) => updateField('dataFim', date?.toISOString() || '')}
                        locale={localeMap[language]}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {showObservacoes && (
            <div className="space-y-2">
              <Label htmlFor="observacoes">{t('common.observations')}</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes || ''}
                onChange={(e) => updateField('observacoes', e.target.value)}
                placeholder={t('common.observations') + '...'}
                rows={2}
                disabled={isObservacoesReadOnly}
                className={isObservacoesReadOnly ? 'bg-muted' : ''}
              />
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
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
                      <AlertDialogAction onClick={onDelete}>
                        {t('common.delete')}
                      </AlertDialogAction>
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
