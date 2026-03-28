import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { NewButton } from '@/components/shared/NewButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RecursoHumanoFormModal } from '@/components/recursos/RecursoHumanoFormModal';
import { MapaEscalasModal } from '@/components/recursos/MapaEscalasModal';
import { MapaOciosidadeModal } from '@/components/recursos/MapaOciosidadeModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { Edit, Trash2, Users, UserX, Calendar, Loader2, Clock } from 'lucide-react';
import { recursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.repository.provider';
import type {
  Ausencia,
  RecursoHumano,
  RecursoHumanoInput,
} from '@/modules/recursos-humanos/recursos-humanos.types';

const RecursosHumanos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Recursos Humanos');
  const podeAlterar = canAlterar('Recursos', 'Recursos Humanos');
  const podeExcluir = canExcluir('Recursos', 'Recursos Humanos');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapaOpen, setIsMapaOpen] = useState(false);
  const [isMapaOciosidadeOpen, setIsMapaOciosidadeOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoHumano | null>(null);
  const [items, setItems] = useState<RecursoHumano[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecursosHumanos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await recursosHumanosRepository.list());
    } catch (error) {
      console.error('Error fetching recursos humanos:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar recursos humanos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    fetchRecursosHumanos();
  }, [fetchRecursosHumanos]);

  const handleSave = async (data: RecursoHumanoInput) => {
    try {
      await recursosHumanosRepository.save({
        ...data,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? 'Colaborador atualizado!' : 'Colaborador criado!',
      });
      await fetchRecursosHumanos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso humano:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) {
      return;
    }

    try {
      await recursosHumanosRepository.remove(id);
      toast({ title: t('common.deleted'), description: t('common.deleted') });
      await fetchRecursosHumanos();
    } catch (error) {
      console.error('Error deleting recurso humano:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const hoje = useMemo(() => startOfDay(new Date()), []);

  const getAusenciaHoje = (item: RecursoHumano): Ausencia | null => {
    return (
      item.ausencias.find((ausencia) => {
        try {
          const inicio = startOfDay(parseISO(ausencia.dataInicio));
          const fim = startOfDay(parseISO(ausencia.dataFim));
          return isWithinInterval(hoje, { start: inicio, end: fim });
        } catch {
          return false;
        }
      }) ?? null
    );
  };

  const filteredItems = items.filter(
    (item) =>
      `${item.nome} ${item.sobrenome}`.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.departamento.toLowerCase().includes(search.toLowerCase()) ||
      item.funcao.toLowerCase().includes(search.toLowerCase()),
  );

  const formatCustoHora = (value: number) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      value,
    );

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
                {item.nome.charAt(0)}
                {item.sobrenome.charAt(0)}
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
      label: t('common.name'),
      render: (item) => {
        const ausenciaHoje = getAusenciaHoje(item);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {item.nome} {item.sobrenome}
            </span>
            {ausenciaHoje && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30"
                    >
                      {ausenciaHoje.motivo}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{ausenciaHoje.motivo}</p>
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
      label: t('common.email'),
      render: (item) => item.email || '-',
    },
    {
      key: 'departamento',
      label: t('field.department'),
      render: (item) => item.departamento || '-',
    },
    {
      key: 'funcao',
      label: t('field.function'),
      render: (item) => item.funcao || '-',
    },
    {
      key: 'custoHora',
      label: t('field.costPerHour'),
      render: (item) => formatCustoHora(item.custoHora),
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (item) => (
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>{item.status}</Badge>
      ),
    },
    {
      key: 'acoes',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={!podeAlterar}
            onClick={(e) => {
              e.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {podeExcluir && (
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
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('humanResources.title')} description={t('field.manageCollaborators')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('field.newCollaborator')}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapaOpen(true)}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          {t('field.scaleMap')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapaOciosidadeOpen(true)}
          className="flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Mapa de Ociosidade
        </Button>
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={t('field.noCollaboratorRegistered')}
            description={t('field.manageCollaboratorsTeam')}
            icon={Users}
            onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            actionLabel={t('field.addCollaborator')}
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
        readOnly={!!editingItem && !podeAlterar}
      />

      <MapaEscalasModal
        isOpen={isMapaOpen}
        onClose={() => setIsMapaOpen(false)}
        recursos={items}
        onUpdateRecurso={podeAlterar ? handleSave : undefined}
      />

      <MapaOciosidadeModal
        isOpen={isMapaOciosidadeOpen}
        onClose={() => setIsMapaOciosidadeOpen(false)}
        recursos={items}
      />
    </div>
  );
};

export default RecursosHumanos;
