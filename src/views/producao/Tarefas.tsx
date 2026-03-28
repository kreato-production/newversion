import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Edit,
  Loader2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { NewButton } from '@/components/shared/NewButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DataCard, PageHeader } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { TarefaFormModal } from '@/components/producao/TarefaFormModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  ApiTarefasRepository,
  type Tarefa,
  type TarefaGravacao,
  type TarefaRecursoHumano,
  type TarefaStatus,
} from '@/modules/tarefas/tarefas.api';

const tarefasRepository = new ApiTarefasRepository();

const Tarefas = () => {
  const { t, formatDate } = useLanguage();
  const { canAlterar, canExcluir, canIncluir } = usePermissions();

  const podeIncluir = canIncluir('ProduÃ§Ã£o', 'Tarefas');
  const podeAlterar = canAlterar('ProduÃ§Ã£o', 'Tarefas');
  const podeExcluir = canExcluir('ProduÃ§Ã£o', 'Tarefas');

  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [statusList, setStatusList] = useState<TarefaStatus[]>([]);
  const [gravacoes, setGravacoes] = useState<TarefaGravacao[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<TarefaRecursoHumano[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGravacao, setFilterGravacao] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const [tarefasData, options] = await Promise.all([
        tarefasRepository.list(),
        tarefasRepository.listOptions(),
      ]);

      setTarefas(tarefasData);
      setStatusList(options.statusList);
      setGravacoes(options.gravacoes);
      setRecursosHumanos(options.recursosHumanos);
    } catch (error) {
      console.error('Error loading tarefas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSave = async (tarefa: Tarefa) => {
    try {
      await tarefasRepository.save(tarefa);
      toast.success(editingTarefa ? t('tasks.updated') : t('tasks.created'));
      setIsModalOpen(false);
      setEditingTarefa(null);
      await loadData(false);
    } catch (error) {
      console.error('Error saving tarefa:', error);
      toast.error('Erro ao salvar tarefa');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tarefasRepository.remove(id);
      toast.success(t('common.deleted'));
      setIsModalOpen(false);
      setEditingTarefa(null);
      await loadData(false);
    } catch (error) {
      console.error('Error deleting tarefa:', error);
      toast.error('Erro ao excluir tarefa');
    }
  };

  const handleEdit = (tarefa: Tarefa) => {
    setEditingTarefa(tarefa);
    setIsModalOpen(true);
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-500';
      case 'media':
        return 'bg-yellow-500';
      case 'baixa':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPrioridadeLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return t('tasks.priorityHigh');
      case 'media':
        return t('tasks.priorityMedium');
      case 'baixa':
        return t('tasks.priorityLow');
      default:
        return prioridade;
    }
  };

  const filteredTarefas = tarefas.filter((tarefa) => {
    const matchesSearch =
      tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.recursoHumanoNome?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || tarefa.statusId === filterStatus;
    const matchesGravacao = filterGravacao === 'all' || tarefa.gravacaoId === filterGravacao;

    return matchesSearch && matchesStatus && matchesGravacao;
  });

  type SortKey =
    | 'titulo'
    | 'gravacaoNome'
    | 'recursoHumanoNome'
    | 'statusNome'
    | 'prioridade'
    | 'dataFim';
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  const sortedTarefas = useMemo(() => {
    if (!sortKey) {
      return filteredTarefas;
    }

    return [...filteredTarefas].sort((a, b) => {
      let aVal: string | number = a[sortKey] || '';
      let bVal: string | number = b[sortKey] || '';

      if (sortKey === 'prioridade') {
        const order: Record<string, number> = { alta: 3, media: 2, baixa: 1 };
        aVal = order[a.prioridade] || 0;
        bVal = order[b.prioridade] || 0;
      }

      if (sortKey === 'dataFim') {
        aVal = a.dataFim ? new Date(a.dataFim).getTime() : 0;
        bVal = b.dataFim ? new Date(b.dataFim).getTime() : 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [filteredTarefas, sortDirection, sortKey]);

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === sortKeyName ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  const totalTarefas = tarefas.length;
  const tarefasPendentes = tarefas.filter(
    (item) => statusList.find((status) => status.id === item.statusId)?.codigo === '01',
  ).length;
  const tarefasProgresso = tarefas.filter(
    (item) => statusList.find((status) => status.id === item.statusId)?.codigo === '02',
  ).length;
  const tarefasConcluidas = tarefas.filter(
    (item) => statusList.find((status) => status.id === item.statusId)?.codigo === '03',
  ).length;

  return (
    <>
      <PageHeader title={t('tasks.title')} description={t('tasks.description')} />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('tasks.total')}</CardDescription>
              <CardTitle className="text-2xl">{totalTarefas}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                {t('tasks.pending')}
              </CardDescription>
              <CardTitle className="text-2xl text-yellow-500">{tarefasPendentes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                {t('tasks.inProgress')}
              </CardDescription>
              <CardTitle className="text-2xl text-blue-500">{tarefasProgresso}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {t('tasks.completed')}
              </CardDescription>
              <CardTitle className="text-2xl text-green-500">{tarefasConcluidas}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <ListActionBar>
          {podeIncluir && (
            <NewButton
              tooltip={t('tasks.new')}
              onClick={() => {
                setEditingTarefa(null);
                setIsModalOpen(true);
              }}
            />
          )}
          <div className="flex-1" />
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('tasks.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {statusList.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterGravacao} onValueChange={setFilterGravacao}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('tasks.filterByRecording')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {gravacoes.map((gravacao) => (
                <SelectItem key={gravacao.id} value={gravacao.id}>
                  {gravacao.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ListActionBar>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedTarefas.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">{t('tasks.empty')}</p>
            {podeIncluir && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTarefa(null);
                  setIsModalOpen(true);
                }}
              >
                {t('tasks.addFirst')}
              </Button>
            )}
          </div>
        ) : (
          <DataCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader label={t('tasks.taskTitle')} sortKeyName="titulo" />
                  <SortHeader label={t('tasks.recording')} sortKeyName="gravacaoNome" />
                  <SortHeader label={t('tasks.assignee')} sortKeyName="recursoHumanoNome" />
                  <SortHeader label={t('tasks.status')} sortKeyName="statusNome" />
                  <SortHeader label={t('tasks.priority')} sortKeyName="prioridade" />
                  <SortHeader label={t('tasks.dueDate')} sortKeyName="dataFim" />
                  <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTarefas.map((tarefa) => (
                  <TableRow
                    key={tarefa.id}
                    className={cn('hover:bg-muted/50', 'cursor-pointer')}
                    onClick={() => handleEdit(tarefa)}
                  >
                    <TableCell className="font-medium">{tarefa.titulo}</TableCell>
                    <TableCell>{tarefa.gravacaoNome || '-'}</TableCell>
                    <TableCell>{tarefa.recursoHumanoNome || '-'}</TableCell>
                    <TableCell>
                      {tarefa.statusNome && (
                        <Badge
                          style={{ backgroundColor: tarefa.statusCor || '#888' }}
                          className="text-white"
                        >
                          {tarefa.statusNome}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-2.5 h-2.5 rounded-full',
                            getPrioridadeColor(tarefa.prioridade),
                          )}
                        />
                        {getPrioridadeLabel(tarefa.prioridade)}
                      </div>
                    </TableCell>
                    <TableCell>{tarefa.dataFim ? formatDate(tarefa.dataFim) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(event) => event.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tarefa)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataCard>
        )}
      </div>

      <TarefaFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
        onDelete={editingTarefa && podeExcluir ? () => handleDelete(editingTarefa.id) : undefined}
        data={editingTarefa}
        statusList={statusList}
        gravacoes={gravacoes}
        recursosHumanos={recursosHumanos}
        readOnly={Boolean(editingTarefa) && !podeAlterar}
      />
    </>
  );
};

export default Tarefas;
