import { useState, useEffect } from 'react';
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
}

export const TarefaFormModal = ({
  open,
  onOpenChange,
  onSave,
  onDelete,
  data,
  statusList,
  gravacoes,
}: TarefaFormModalProps) => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<Partial<Tarefa>>({});
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);

  const localeMap = { pt: ptBR, en: enUS, es: es };

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

  useEffect(() => {
    // Load recursos humanos
    const storedRH = localStorage.getItem('kreato_recursos_humanos');
    if (storedRH) {
      setRecursosHumanos(JSON.parse(storedRH));
    }
  }, []);

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? t('tasks.edit') : t('tasks.new')}</DialogTitle>
          <DialogDescription>
            {t('tasks.formDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="titulo">{t('tasks.taskTitle')} *</Label>
            <Input
              id="titulo"
              value={formData.titulo || ''}
              onChange={(e) => updateField('titulo', e.target.value)}
              placeholder={t('tasks.taskTitlePlaceholder')}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="descricao">{t('tasks.taskDescription')}</Label>
            <Textarea
              id="descricao"
              value={formData.descricao || ''}
              onChange={(e) => updateField('descricao', e.target.value)}
              placeholder={t('tasks.taskDescriptionPlaceholder')}
              rows={3}
            />
          </div>

          {/* Recording & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('tasks.recording')} *</Label>
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
            </div>

            <div className="space-y-2">
              <Label>{t('tasks.status')} *</Label>
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
            </div>
          </div>

          {/* Assignee & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('tasks.assignee')} *</Label>
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
            </div>

            <div className="space-y-2">
              <Label>{t('tasks.priority')}</Label>
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
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('tasks.startDate')}</Label>
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
            </div>

            <div className="space-y-2">
              <Label>{t('tasks.dueDate')}</Label>
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
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">{t('common.observations')}</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ''}
              onChange={(e) => updateField('observacoes', e.target.value)}
              placeholder={t('common.observations') + '...'}
              rows={2}
            />
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {onDelete && (
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
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="gradient-primary">
                {t('common.save')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
