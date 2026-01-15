import { useState, useEffect } from 'react';
import { Plus, Search, Filter, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageComponents';
import { TarefaFormModal } from '@/components/producao/TarefaFormModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

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

const Tarefas = () => {
  const { t, formatDate } = useLanguage();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [statusList, setStatusList] = useState<StatusTarefa[]>([]);
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGravacao, setFilterGravacao] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<Tarefa | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load status list
    const storedStatus = localStorage.getItem('kreato_status_tarefa');
    if (storedStatus) {
      setStatusList(JSON.parse(storedStatus));
    } else {
      // Default status
      const defaultStatus = [
        { id: '1', codigo: 'PEND', nome: 'Pendente', cor: '#f59e0b' },
        { id: '2', codigo: 'PROG', nome: 'Em Progresso', cor: '#3b82f6' },
        { id: '3', codigo: 'CONC', nome: 'Concluída', cor: '#22c55e' },
        { id: '4', codigo: 'CANC', nome: 'Cancelada', cor: '#ef4444' },
      ];
      localStorage.setItem('kreato_status_tarefa', JSON.stringify(defaultStatus));
      setStatusList(defaultStatus);
    }

    // Load gravacoes
    const storedGravacoes = localStorage.getItem('kreato_gravacoes');
    if (storedGravacoes) {
      setGravacoes(JSON.parse(storedGravacoes));
    }

    // Load tarefas
    const storedTarefas = localStorage.getItem('kreato_tarefas');
    if (storedTarefas) {
      setTarefas(JSON.parse(storedTarefas));
    }
  };

  const saveTarefas = (newTarefas: Tarefa[]) => {
    localStorage.setItem('kreato_tarefas', JSON.stringify(newTarefas));
    setTarefas(newTarefas);
  };

  const handleSave = (tarefa: Tarefa) => {
    const status = statusList.find(s => s.id === tarefa.statusId);
    const gravacao = gravacoes.find(g => g.id === tarefa.gravacaoId);
    
    const tarefaWithNames = {
      ...tarefa,
      statusNome: status?.nome,
      statusCor: status?.cor,
      gravacaoNome: gravacao?.nome,
      dataAtualizacao: new Date().toISOString(),
    };

    if (editingTarefa) {
      const newTarefas = tarefas.map(t => 
        t.id === tarefa.id ? tarefaWithNames : t
      );
      saveTarefas(newTarefas);
      toast.success(t('tasks.updated'));
    } else {
      tarefaWithNames.dataCriacao = new Date().toISOString();
      saveTarefas([...tarefas, tarefaWithNames]);
      toast.success(t('tasks.created'));
    }
    setIsModalOpen(false);
    setEditingTarefa(null);
  };

  const handleDelete = (id: string) => {
    const newTarefas = tarefas.filter(t => t.id !== id);
    saveTarefas(newTarefas);
    toast.success(t('common.deleted'));
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

  // Statistics
  const totalTarefas = tarefas.length;
  const tarefasPendentes = tarefas.filter(t => 
    statusList.find(s => s.id === t.statusId)?.codigo === 'PEND'
  ).length;
  const tarefasProgresso = tarefas.filter(t => 
    statusList.find(s => s.id === t.statusId)?.codigo === 'PROG'
  ).length;
  const tarefasConcluidas = tarefas.filter(t => 
    statusList.find(s => s.id === t.statusId)?.codigo === 'CONC'
  ).length;

  return (
    <>
      <PageHeader
        title={t('tasks.title')}
        description={t('tasks.description')}
        onAdd={() => { setEditingTarefa(null); setIsModalOpen(true); }}
        addLabel={t('tasks.new')}
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

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
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
        </div>

        {/* Tasks List */}
        {filteredTarefas.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">{t('tasks.empty')}</p>
            <Button variant="outline" onClick={() => { setEditingTarefa(null); setIsModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('tasks.addFirst')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTarefas.map(tarefa => (
              <Card 
                key={tarefa.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleEdit(tarefa)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${getPrioridadeColor(tarefa.prioridade)}`}
                          title={getPrioridadeLabel(tarefa.prioridade)}
                        />
                        <h3 className="font-semibold">{tarefa.titulo}</h3>
                        {tarefa.statusNome && (
                          <Badge 
                            style={{ backgroundColor: tarefa.statusCor || '#888' }}
                            className="text-white"
                          >
                            {tarefa.statusNome}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {tarefa.descricao}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {tarefa.gravacaoNome && (
                          <span>{t('tasks.recording')}: {tarefa.gravacaoNome}</span>
                        )}
                        {tarefa.recursoHumanoNome && (
                          <span>{t('tasks.assignee')}: {tarefa.recursoHumanoNome}</span>
                        )}
                        {tarefa.dataFim && (
                          <span>{t('tasks.dueDate')}: {formatDate(tarefa.dataFim)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TarefaFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
        onDelete={editingTarefa ? () => handleDelete(editingTarefa.id) : undefined}
        data={editingTarefa}
        statusList={statusList}
        gravacoes={gravacoes}
      />
    </>
  );
};

export default Tarefas;
