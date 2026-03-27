import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Film, Loader2, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { ConteudoFormModal } from '@/components/producao/ConteudoFormModal';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { isBackendDataProviderEnabled } from '@/lib/api/http';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';
import type { Conteudo, ConteudoInput } from '@/modules/conteudos/conteudos.types';
import { generateCodigoConteudo } from '@/modules/conteudos/conteudos.types';

const Conteudo = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const shouldUseBackend = useMemo(() => isBackendDataProviderEnabled(), []);

  const podeIncluir = canIncluir('ProduÃ§Ã£o', 'ConteÃºdo');
  const podeAlterar = canAlterar('ProduÃ§Ã£o', 'ConteÃºdo');
  const podeExcluir = canExcluir('ProduÃ§Ã£o', 'ConteÃºdo');

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Conteudo | null>(null);
  const [items, setItems] = useState<Conteudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCloning, setIsCloning] = useState(false);

  const fetchConteudos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await conteudosRepository.list();
      setItems(
        user?.unidadeIds && user.unidadeIds.length > 0
          ? data.filter(
              (item) => !item.unidadeNegocioId || user.unidadeIds?.includes(item.unidadeNegocioId),
            )
          : data,
      );
    } catch (error) {
      console.error('Error fetching conteudos:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar conteúdos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast, user?.unidadeIds]);

  useEffect(() => {
    fetchConteudos();
  }, [fetchConteudos]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClone = async () => {
    if (shouldUseBackend) {
      toast({
        title: t('common.warning') || 'Aviso',
        description: 'A clonagem de conteúdo ainda não foi migrada para o backend local.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedIds.size === 0) {
      toast({
        title: t('common.warning') || 'Aviso',
        description: 'Selecione ao menos um registro para clonar.',
        variant: 'destructive',
      });
      return;
    }

    setIsCloning(true);
    try {
      for (const sourceId of selectedIds) {
        const { data: original, error: fetchErr } = await supabase
          .from('conteudos')
          .select('*')
          .eq('id', sourceId)
          .single();

        if (fetchErr || !original) {
          throw fetchErr || new Error('Not found');
        }

        const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...rest } = original;
        const cloneData = {
          ...rest,
          descricao: `Clone de : ${original.descricao}`,
          codigo_externo: generateCodigoConteudo(),
        };

        const { data: newConteudo, error: insertErr } = await supabase
          .from('conteudos')
          .insert(cloneData)
          .select()
          .single();

        if (insertErr || !newConteudo) {
          throw insertErr;
        }

        const { data: recursosFisicos } = await supabase
          .from('conteudo_recursos_fisicos')
          .select('*')
          .eq('conteudo_id', sourceId);

        if (recursosFisicos && recursosFisicos.length > 0) {
          const clonedRF = recursosFisicos.map(
            ({ id: _id, created_at: _createdAt, conteudo_id: _conteudoId, ...resource }) => ({
              ...resource,
              conteudo_id: newConteudo.id,
            }),
          );
          await supabase.from('conteudo_recursos_fisicos').insert(clonedRF);
        }

        const { data: recursosTecnicos } = await supabase
          .from('conteudo_recursos_tecnicos')
          .select('*')
          .eq('conteudo_id', sourceId);

        if (recursosTecnicos && recursosTecnicos.length > 0) {
          const clonedRT = recursosTecnicos.map(
            ({ id: _id, created_at: _createdAt, conteudo_id: _conteudoId, ...resource }) => ({
              ...resource,
              conteudo_id: newConteudo.id,
            }),
          );
          await supabase.from('conteudo_recursos_tecnicos').insert(clonedRT);
        }

        const { data: terceiros } = await supabase
          .from('conteudo_terceiros')
          .select('*')
          .eq('conteudo_id', sourceId);

        if (terceiros && terceiros.length > 0) {
          const clonedT = terceiros.map(
            ({ id: _id, created_at: _createdAt, conteudo_id: _conteudoId, ...thirdParty }) => ({
              ...thirdParty,
              conteudo_id: newConteudo.id,
            }),
          );
          await supabase.from('conteudo_terceiros').insert(clonedT);
        }
      }

      toast({
        title: t('common.success'),
        description: `${selectedIds.size} registro(s) clonado(s) com sucesso.`,
      });
      setSelectedIds(new Set());
      await fetchConteudos();
    } catch (error) {
      console.error('Error cloning conteudo:', error);
      toast({
        title: t('common.error'),
        description: 'Erro ao clonar registro.',
        variant: 'destructive',
      });
    } finally {
      setIsCloning(false);
    }
  };

  const handleSave = async (data: ConteudoInput) => {
    try {
      await conteudosRepository.save(
        {
          ...data,
          tenantId: user?.tenantId ?? null,
        },
        user?.id,
      );

      toast({
        title: t('common.success'),
        description: editingItem ? t('field.contentUpdated') : t('field.contentCreated'),
      });

      await fetchConteudos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving conteudo:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar conteúdo: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('field.confirmDeleteContent'))) {
      return;
    }

    try {
      await conteudosRepository.remove(id);
      toast({ title: t('common.deleted'), description: t('field.contentDeleted') });
      await fetchConteudos();
    } catch (error) {
      console.error('Error deleting conteudo:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir conteúdo: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Conteudo>[] = [
    {
      key: 'select',
      label: '',
      className: 'w-10',
      sortable: false,
      render: (item) => (
        <Checkbox
          checked={selectedIds.has(item.id)}
          onCheckedChange={() => toggleSelection(item.id)}
          onClick={(event) => event.stopPropagation()}
        />
      ),
    },
    {
      key: 'descricao',
      label: t('common.description'),
      render: (item) => <span className="font-medium">{item.descricao}</span>,
    },
    {
      key: 'quantidadeEpisodios',
      label: t('content.episodes'),
      className: 'w-24 text-center',
      render: (item) => <span className="font-mono">{item.quantidadeEpisodios}</span>,
    },
    {
      key: 'centroLucro',
      label: t('menu.profitCenters'),
      render: (item) => item.centroLucro || '-',
    },
    {
      key: 'anoProducao',
      label: t('content.productionYear'),
      className: 'w-20',
      render: (item) => item.anoProducao || '-',
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
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
            onClick={(event) => {
              event.stopPropagation();
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
              onClick={(event) => {
                event.stopPropagation();
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
      <PageHeader title={t('content.title')} description={t('content.description')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('content.new')}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
        {podeIncluir && !shouldUseBackend && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleClone}
                  disabled={selectedIds.size === 0 || isCloning}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isCloning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clone</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={t('content.empty')}
            description={t('content.emptyDescription')}
            icon={Film}
            onAction={() => setIsModalOpen(true)}
            actionLabel={t('content.new')}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_conteudos_table"
          />
        )}
      </DataCard>

      <ConteudoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
      />
    </div>
  );
};

export default Conteudo;
