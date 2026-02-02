import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Users, UserX, Calendar, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RecursoHumanoFormModal } from '@/components/recursos/RecursoHumanoFormModal';
import { MapaEscalasModal } from '@/components/recursos/MapaEscalasModal';
import { parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type RecursoHumanoDB = Tables<'recursos_humanos'>;

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUrl: string;
}

export interface Ausencia {
  id: string;
  motivo: 'Férias' | 'Folga' | 'Licença Maternidade' | 'Licença Paternidade' | 'Curso Externo' | 'Viagem de Trabalho';
  dataInicio: string;
  dataFim: string;
  dias: number;
}

export interface Escala {
  id: string;
  dataInicio: string;
  horaInicio: string;
  dataFim: string;
  horaFim: string;
  diasSemana: number[];
}

export interface RecursoHumano {
  id: string;
  codigoExterno: string;
  nome: string;
  sobrenome: string;
  foto?: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  departamento: string;
  departamentoId?: string;
  funcao: string;
  funcaoId?: string;
  custoHora: number;
  dataContratacao: string;
  status: 'Ativo' | 'Inativo';
  dataCadastro: string;
  usuarioCadastro: string;
  anexos?: Anexo[];
  ausencias?: Ausencia[];
  escalas?: Escala[];
}

const mapDbToRecursoHumano = (
  db: RecursoHumanoDB & { 
    departamentos?: { nome: string } | null; 
    funcoes?: { nome: string } | null;
  },
  ausencias: Ausencia[] = [],
  escalas: Escala[] = [],
  anexos: Anexo[] = []
): RecursoHumano => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  nome: db.nome,
  sobrenome: db.sobrenome,
  foto: db.foto_url || undefined,
  dataNascimento: db.data_nascimento || '',
  sexo: db.sexo || '',
  telefone: db.telefone || '',
  email: db.email || '',
  departamento: db.departamentos?.nome || '',
  departamentoId: db.departamento_id || undefined,
  funcao: db.funcoes?.nome || '',
  funcaoId: db.funcao_id || undefined,
  custoHora: db.custo_hora || 0,
  dataContratacao: db.data_contratacao || '',
  status: db.status || 'Ativo',
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: '',
  ausencias,
  escalas,
  anexos,
});

const RecursosHumanos = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapaOpen, setIsMapaOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoHumano | null>(null);
  const [items, setItems] = useState<RecursoHumano[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecursosHumanos = async () => {
    setIsLoading(true);
    try {
      const { data: recursosData, error: recursosError } = await supabase
        .from('recursos_humanos')
        .select('*, departamentos:departamento_id(nome), funcoes:funcao_id(nome)')
        .order('nome');

      if (recursosError) throw recursosError;

      const recursosWithDetails = await Promise.all(
        (recursosData || []).map(async (rh) => {
          const [ausenciasRes, escalasRes, anexosRes] = await Promise.all([
            supabase.from('rh_ausencias').select('*').eq('recurso_humano_id', rh.id),
            supabase.from('rh_escalas').select('*').eq('recurso_humano_id', rh.id),
            supabase.from('rh_anexos').select('*').eq('recurso_humano_id', rh.id),
          ]);

          const ausencias: Ausencia[] = (ausenciasRes.data || []).map((a) => ({
            id: a.id,
            motivo: a.motivo as Ausencia['motivo'],
            dataInicio: a.data_inicio,
            dataFim: a.data_fim,
            dias: a.dias,
          }));

          const escalas: Escala[] = (escalasRes.data || []).map((e) => ({
            id: e.id,
            dataInicio: e.data_inicio,
            horaInicio: e.hora_inicio,
            dataFim: e.data_fim,
            horaFim: e.hora_fim,
            diasSemana: e.dias_semana || [1, 2, 3, 4, 5],
          }));

          const anexos: Anexo[] = (anexosRes.data || []).map((a) => ({
            id: a.id,
            nome: a.nome,
            tipo: a.tipo || '',
            tamanho: a.tamanho || 0,
            dataUrl: a.url,
          }));

          return mapDbToRecursoHumano(rh, ausencias, escalas, anexos);
        })
      );

      setItems(recursosWithDetails);
    } catch (error) {
      console.error('Error fetching recursos humanos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar colaboradores', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecursosHumanos();
  }, []);

  const handleSave = async (data: RecursoHumano, isUpdateFromMap: boolean = false) => {
    try {
      // Validate and map sexo value - send null if empty or invalid
      const validSexoValues = ['Masculino', 'Feminino', 'Outro'];
      const sexoValue = data.sexo && validSexoValues.includes(data.sexo) 
        ? (data.sexo as 'Masculino' | 'Feminino' | 'Outro') 
        : null;

      const dbData: TablesInsert<'recursos_humanos'> = {
        id: data.id || undefined,
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        sobrenome: data.sobrenome,
        foto_url: data.foto || null,
        data_nascimento: data.dataNascimento || null,
        sexo: sexoValue,
        telefone: data.telefone || null,
        email: data.email || null,
        departamento_id: data.departamentoId || null,
        funcao_id: data.funcaoId || null,
        custo_hora: data.custoHora || 0,
        data_contratacao: data.dataContratacao || null,
        status: data.status as 'Ativo' | 'Inativo',
      };

      let recursoId = data.id;

      // Check if this is an update: either editingItem is set, or we have an existing ID and it's from map update
      const isUpdate = editingItem || (isUpdateFromMap && data.id);

      if (isUpdate) {
        const { error } = await supabase
          .from('recursos_humanos')
          .update(dbData as TablesUpdate<'recursos_humanos'>)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Remove id for insert to let the database generate it
        const insertData = { ...dbData };
        delete insertData.id;
        
        const { data: inserted, error } = await supabase
          .from('recursos_humanos')
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        recursoId = inserted.id;
      }

      // Handle escalas
      if (data.escalas) {
        await supabase.from('rh_escalas').delete().eq('recurso_humano_id', recursoId);
        if (data.escalas.length > 0) {
          const escalasData = data.escalas.map((e) => ({
            recurso_humano_id: recursoId,
            data_inicio: e.dataInicio,
            hora_inicio: e.horaInicio,
            data_fim: e.dataFim,
            hora_fim: e.horaFim,
            dias_semana: e.diasSemana,
          }));
          await supabase.from('rh_escalas').insert(escalasData);
        }
      }

      // Handle ausencias
      if (data.ausencias) {
        await supabase.from('rh_ausencias').delete().eq('recurso_humano_id', recursoId);
        if (data.ausencias.length > 0) {
          const ausenciasData = data.ausencias.map((a) => ({
            recurso_humano_id: recursoId,
            motivo: a.motivo,
            data_inicio: a.dataInicio,
            data_fim: a.dataFim,
            dias: a.dias,
          }));
          await supabase.from('rh_ausencias').insert(ausenciasData);
        }
      }

      toast({ title: 'Sucesso', description: editingItem ? 'Colaborador atualizado!' : 'Colaborador cadastrado!' });
      await fetchRecursosHumanos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso humano:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar colaborador', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este colaborador?')) {
      try {
        const { error } = await supabase.from('recursos_humanos').delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'Excluído', description: 'Colaborador removido!' });
        await fetchRecursosHumanos();
      } catch (error) {
        console.error('Error deleting recurso humano:', error);
        toast({ title: 'Erro', description: 'Erro ao excluir colaborador', variant: 'destructive' });
      }
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.sobrenome.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase())
  );

  const hoje = useMemo(() => startOfDay(new Date()), []);

  const getAusenciaHoje = (item: RecursoHumano) => {
    if (!item.ausencias || item.ausencias.length === 0) return null;
    
    return item.ausencias.find((ausencia) => {
      const inicio = startOfDay(parseISO(ausencia.dataInicio));
      const fim = startOfDay(parseISO(ausencia.dataFim));
      return isWithinInterval(hoje, { start: inicio, end: fim });
    });
  };

  const columns: Column<RecursoHumano>[] = [
    {
      key: 'foto',
      label: '',
      className: 'w-12',
      sortable: false,
      render: (item) => {
        const ausenciaHoje = getAusenciaHoje(item);
        return (
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage src={item.foto} />
              <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
                {item.nome.charAt(0)}{item.sobrenome.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {ausenciaHoje && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <UserX className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => {
        const ausenciaHoje = getAusenciaHoje(item);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.nome} {item.sobrenome}</span>
            {ausenciaHoje && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                      {ausenciaHoje.motivo}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ausente hoje: {ausenciaHoje.motivo}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'departamento',
      label: 'Departamento',
      render: (item) => item.departamento || '-',
    },
    {
      key: 'funcao',
      label: 'Função',
      render: (item) => item.funcao || '-',
    },
    {
      key: 'custoHora',
      label: 'Custo/Hora',
      render: (item) => formatCurrency(item.custoHora),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'acoes',
      label: 'Ações',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recursos Humanos"
        description="Gerencie os colaboradores da organização"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Novo Colaborador"
      />

      <ListActionBar>
        <SearchBar value={search} onChange={setSearch} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapaOpen(true)}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Mapa de Escalas
        </Button>
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum colaborador cadastrado"
            description="Adicione colaboradores para gerenciar sua equipe."
            icon={Users}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Colaborador"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_recursos_humanos_table"
          />
        )}
      </DataCard>

      <RecursoHumanoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
      />

      <MapaEscalasModal
        isOpen={isMapaOpen}
        onClose={() => setIsMapaOpen(false)}
        recursos={items}
        onUpdateRecurso={async (updatedRecurso) => {
          await handleSave(updatedRecurso, true);
        }}
      />
    </div>
  );
};

export default RecursosHumanos;
