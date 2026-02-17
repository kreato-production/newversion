import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle2, Clock, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Edit, Loader2 } from 'lucide-react';
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
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageHeader, DataCard } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { TarefaFormModal } from '@/components/producao/TarefaFormModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type TarefaDB = Tables<'tarefas'>;
type StatusTarefaDB = Tables<'status_tarefa'>;
type GravacaoDB = Tables<'gravacoes'>;

interface Tarefa {
  id: string;
  gravacaoId: string;
  gravacaoNome?: string;
  recursoHumanoId: string;
  recursoHumanoNome?: string;
  recursoTecnicoId?: string;
  recursoTecnicoNome?: string;
  titulo: string;
  descricao: string;
  statusId: string;
  statusNome?: string;
  statusCor?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  dataInicio: string;
  dataFim: string;
  horaInicio?: string;
  horaFim?: string;
  dataCriacao: string;
  dataAtualizacao: string;
  observacoes?: string;
}

interface StatusTarefa {
  id: string;
  codigo: string;
  nome: string;
  cor?: string;
  is_inicial?: boolean;
}

interface Gravacao {
  id: string;
  nome: string;
}

const Tarefas = () => {
  const { t, formatDate } = useLanguage();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const { user } = useAuth();
  
  const podeIncluir = canIncluir('Produção', 'Tarefas');
  const podeAlterar = canAlterar('Produção', 'Tarefas');
  const podeExcluir = canExcluir('Produção', 'Tarefas');
  
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [statusList, setStatusList] = useState<StatusTarefa[]>([]);
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGravacao, setFilterGravacao] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allowedRHIds, setAllowedRHIds] = useState<string[] | null>(null); // null = no filter (admin/all)

  // Fetch the allowed RH IDs based on user tipo_acesso
  const loadAllowedRHIds = async () => {
    if (!user) return;

    const tipoAcesso = user.tipoAcesso || 'Operacional';
    const recursoHumanoId = user.recursoHumanoId;

    if (tipoAcesso === 'Operacional') {
      // Only show tasks assigned to the user's recurso_humano
      if (recursoHumanoId) {
        setAllowedRHIds([recursoHumanoId]);
      } else {
        // No RH linked - show no tasks
        setAllowedRHIds([]);
      }
    } else if (tipoAcesso === 'Coordenação') {
      // Show tasks from all RH members of the user's teams + own tasks
      try {
        // Get user's equipes
        const { data: userEquipes, error: ueError } = await supabase
          .from('usuario_equipes')
          .select('equipe_id')
          .eq('usuario_id', user.id);

        if (ueError) throw ueError;

        const equipeIds = (userEquipes || []).map(ue => ue.equipe_id);

        if (equipeIds.length === 0) {
          // No teams - only own tasks
          setAllowedRHIds(recursoHumanoId ? [recursoHumanoId] : []);
          return;
        }

        // Get all RH members from those teams
        const { data: membros, error: mError } = await supabase
          .from('equipe_membros')
          .select('recurso_humano_id')
          .in('equipe_id', equipeIds);

        if (mError) throw mError;

        const rhIds = new Set((membros || []).map(m => m.recurso_humano_id));
        // Also include own RH id
        if (recursoHumanoId) {
          rhIds.add(recursoHumanoId);
        }

        setAllowedRHIds(Array.from(rhIds));
      } catch (error) {
        console.error('Error loading allowed RH IDs:', error);
        // Fallback: show only own tasks
        setAllowedRHIds(recursoHumanoId ? [recursoHumanoId] : []);
      }
    } else {
      // Unknown type - no filter
      setAllowedRHIds(null);
    }
  };

  const loadData = async (showLoading = true) => {
    const shouldShowLoading = showLoading && tarefas.length === 0;
    if (shouldShowLoading) setIsLoading(true);
    try {
      // Load status list
      const { data: statusData, error: statusError } = await supabase
        .from('status_tarefa')
        .select('*')
        .order('nome');

      if (statusError) throw statusError;
      
      const mappedStatus: StatusTarefa[] = (statusData || []).map(s => ({
        id: s.id,
        codigo: s.codigo,
        nome: s.nome,
        cor: s.cor || undefined,
        is_inicial: (s as any).is_inicial || false,
      }));
      setStatusList(mappedStatus);

      // Load gravacoes (filtered by unidade de negócio)
      let gravacoesQuery = supabase
        .from('gravacoes')
        .select('id, nome, unidade_negocio_id')
        .order('nome');

      if (user?.unidadeIds && user.unidadeIds.length > 0) {
        gravacoesQuery = gravacoesQuery.in('unidade_negocio_id', user.unidadeIds);
      }

      const { data: gravacoesData, error: gravacoesError } = await gravacoesQuery;

      if (gravacoesError) throw gravacoesError;
      setGravacoes(gravacoesData || []);

      // Load tarefas with relations
      let query = supabase
        .from('tarefas')
        .select(`
          *,
          hora_inicio,
          hora_fim,
          gravacoes:gravacao_id(nome, unidade_negocio_id),
          recursos_humanos:recurso_humano_id(nome, sobrenome),
          recursos_tecnicos:recurso_tecnico_id(nome),
          status_tarefa:status_id(nome, cor)
        `)
        .order('created_at', { ascending: false });

      // Apply RH filter if set
      if (allowedRHIds !== null && allowedRHIds.length > 0) {
        query = query.in('recurso_humano_id', allowedRHIds);
      } else if (allowedRHIds !== null && allowedRHIds.length === 0) {
        // No allowed IDs - return empty
        setTarefas([]);
        setIsLoading(false);
        return;
      }

      // Filter by allowed gravação IDs (based on unidade de negócio)
      const allowedGravacaoIds = (gravacoesData || []).map((g: any) => g.id);
      if (user?.unidadeIds && user.unidadeIds.length > 0 && allowedGravacaoIds.length > 0) {
        query = query.in('gravacao_id', allowedGravacaoIds);
      } else if (user?.unidadeIds && user.unidadeIds.length > 0 && allowedGravacaoIds.length === 0) {
        setTarefas([]);
        setIsLoading(false);
        return;
      }

      const { data: tarefasData, error: tarefasError } = await query;

      if (tarefasError) throw tarefasError;

      const mappedTarefas: Tarefa[] = (tarefasData || []).map(t => ({
        id: t.id,
        gravacaoId: t.gravacao_id || '',
        gravacaoNome: t.gravacoes?.nome || undefined,
        recursoHumanoId: t.recurso_humano_id || '',
        recursoHumanoNome: t.recursos_humanos ? `${t.recursos_humanos.nome} ${t.recursos_humanos.sobrenome}` : undefined,
        recursoTecnicoId: t.recurso_tecnico_id || undefined,
        recursoTecnicoNome: t.recursos_tecnicos?.nome || undefined,
        titulo: t.titulo,
        descricao: t.descricao || '',
        statusId: t.status_id || '',
        statusNome: t.status_tarefa?.nome || undefined,
        statusCor: t.status_tarefa?.cor || undefined,
        prioridade: t.prioridade || 'media',
        dataInicio: t.data_inicio || '',
        dataFim: t.data_fim || '',
        horaInicio: (t as any).hora_inicio?.substring(0, 5) || undefined,
        horaFim: (t as any).hora_fim?.substring(0, 5) || undefined,
        dataCriacao: t.created_at || '',
        dataAtualizacao: t.updated_at || '',
        observacoes: t.observacoes || undefined,
      }));
      setTarefas(mappedTarefas);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      if (shouldShowLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllowedRHIds();
  }, [user]);

  useEffect(() => {
    if (allowedRHIds !== undefined) {
      loadData();
    }
  }, [allowedRHIds]);

  const handleSave = async (tarefa: Tarefa) => {
    try {
      const dbData: any = {
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || null,
        gravacao_id: tarefa.gravacaoId || null,
        recurso_humano_id: tarefa.recursoHumanoId || (editingTarefa?.recursoHumanoId) || null,
        recurso_tecnico_id: tarefa.recursoTecnicoId || null,
        status_id: tarefa.statusId || null,
        prioridade: tarefa.prioridade,
        data_inicio: tarefa.dataInicio || null,
        data_fim: tarefa.dataFim || null,
        hora_inicio: tarefa.horaInicio || null,
        hora_fim: tarefa.horaFim || null,
        observacoes: tarefa.observacoes || null,
      };

      if (editingTarefa) {
        const { error } = await supabase
          .from('tarefas')
          .update(dbData as TablesUpdate<'tarefas'>)
          .eq('id', tarefa.id);
        if (error) throw error;
        toast.success(t('tasks.updated'));
      } else {
        dbData.id = tarefa.id || undefined;
        const { error } = await supabase.from('tarefas').insert(dbData);
        if (error) throw error;
        toast.success(t('tasks.created'));
      }

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
      const { error } = await supabase.from('tarefas').delete().eq('id', id);
      if (error) throw error;
      toast.success(t('common.deleted'));
      await loadData();
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
      case 'alta': return 'bg-red-500';
      case 'media': return 'bg-yellow-500';
      case 'baixa': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPrioridadeLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return t('tasks.priorityHigh');
      case 'media': return t('tasks.priorityMedium');
      case 'baixa': return t('tasks.priorityLow');
      default: return prioridade;
    }
  };

  const filteredTarefas = tarefas.filter(tarefa => {
    const matchesSearch = 
      tarefa.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarefa.recursoHumanoNome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || tarefa.statusId === filterStatus;
    const matchesGravacao = filterGravacao === 'all' || tarefa.gravacaoId === filterGravacao;
    
    return matchesSearch && matchesStatus && matchesGravacao;
  });

  // Sorting
  type SortKey = 'titulo' | 'gravacaoNome' | 'recursoHumanoNome' | 'statusNome' | 'prioridade' | 'dataFim';
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedTarefas = useMemo(() => {
    if (!sortKey) return filteredTarefas;

    return [...filteredTarefas].sort((a, b) => {
      let aVal: string | number = a[sortKey] || '';
      let bVal: string | number = b[sortKey] || '';
      
      if (sortKey === 'prioridade') {
        const prioOrder: Record<string, number> = { alta: 3, media: 2, baixa: 1 };
        aVal = prioOrder[a.prioridade] || 0;
        bVal = prioOrder[b.prioridade] || 0;
      }
      
      if (sortKey === 'dataFim') {
        aVal = a.dataFim ? new Date(a.dataFim).getTime() : 0;
        bVal = b.dataFim ? new Date(b.dataFim).getTime() : 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filteredTarefas, sortKey, sortDirection]);

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === sortKeyName ? (
          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  // Statistics
  const totalTarefas = tarefas.length;
  const tarefasPendentes = tarefas.filter(t => 
    statusList.find(s => s.id === t.statusId)?.codigo === '01'
  ).length;
  const tarefasProgresso = tarefas.filter(t => 
    statusList.find(s => s.id === t.statusId)?.codigo === '02'
  ).length;
  const tarefasConcluidas = tarefas.filter(t => 
    statusList.find(s => s.id === t.statusId)?.codigo === '03'
  ).length;

  return (
    <>
      <PageHeader
        title={t('tasks.title')}
        description={t('tasks.description')}
      />

      <div className="space-y-6">
        {/* Statistics Cards */}
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

        {/* Filters in ListActionBar */}
        <ListActionBar>
          {podeIncluir && (
            <NewButton tooltip={t('tasks.new')} onClick={() => { setEditingTarefa(null); setIsModalOpen(true); }} />
          )}
          <div className="flex-1" />
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('tasks.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {statusList.map(status => (
                <SelectItem key={status.id} value={status.id}>{status.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterGravacao} onValueChange={setFilterGravacao}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('tasks.filterByRecording')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {gravacoes.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ListActionBar>

        {/* Tasks Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedTarefas.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">{t('tasks.empty')}</p>
            {podeIncluir && (
              <Button variant="outline" onClick={() => { setEditingTarefa(null); setIsModalOpen(true); }}>
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
                {sortedTarefas.map(tarefa => (
                    <TableRow 
                      key={tarefa.id} 
                      className={cn(
                        "hover:bg-muted/50",
                        "cursor-pointer"
                      )}
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
                        <div className={cn("w-2.5 h-2.5 rounded-full", getPrioridadeColor(tarefa.prioridade))} />
                        {getPrioridadeLabel(tarefa.prioridade)}
                      </div>
                    </TableCell>
                    <TableCell>{tarefa.dataFim ? formatDate(tarefa.dataFim) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(tarefa)}
                        >
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
        readOnly={editingTarefa && !podeAlterar}
      />
    </>
  );
};

export default Tarefas;
