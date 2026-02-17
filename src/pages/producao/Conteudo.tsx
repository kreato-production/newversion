import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Film, Loader2, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { ConteudoFormModal } from '@/components/producao/ConteudoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';

type ConteudoDB = Tables<'conteudos'>;

// Helper function to generate content code (for backwards compatibility)
// Max 10 characters to fit in codigo_externo column
export const generateCodigoConteudo = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  return `C${timestamp}`;
};

export interface Conteudo {
  id: string;
  codigoExterno: string;
  descricao: string;
  quantidadeEpisodios: number;
  centroLucro: string;
  centroLucroId?: string;
  unidadeNegocio: string;
  unidadeNegocioId?: string;
  tipoConteudo: string;
  tipoConteudoId?: string;
  classificacao: string;
  classificacaoId?: string;
  anoProducao: string;
  sinopse: string;
  usuarioCadastro: string;
  dataCadastro: string;
  tabelaPrecoId?: string;
  tabelaPrecoNome?: string;
  frequenciaDataInicio?: string;
  frequenciaDataFim?: string;
  frequenciaDiasSemana?: number[];
}

const mapDbToConteudo = (
  db: ConteudoDB & {
    centros_lucro?: { nome: string } | null;
    unidades_negocio?: { nome: string } | null;
    tipos_gravacao?: { nome: string } | null;
    classificacoes?: { nome: string } | null;
    tabelas_preco?: { nome: string } | null;
  }
): Conteudo & { orcamento?: number } => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  descricao: db.descricao,
  quantidadeEpisodios: db.quantidade_episodios || 0,
  centroLucro: db.centros_lucro?.nome || '',
  centroLucroId: db.centro_lucro_id || undefined,
  unidadeNegocio: db.unidades_negocio?.nome || '',
  unidadeNegocioId: db.unidade_negocio_id || undefined,
  tipoConteudo: db.tipos_gravacao?.nome || '',
  tipoConteudoId: db.tipo_conteudo_id || undefined,
  classificacao: db.classificacoes?.nome || '',
  classificacaoId: db.classificacao_id || undefined,
  anoProducao: db.ano_producao || '',
  sinopse: db.sinopse || '',
  usuarioCadastro: '',
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  orcamento: db.orcamento || 0,
  tabelaPrecoId: (db as any).tabela_preco_id || undefined,
  tabelaPrecoNome: (db as any).tabelas_preco?.nome || '',
  frequenciaDataInicio: (db as any).frequencia_data_inicio || undefined,
  frequenciaDataFim: (db as any).frequencia_data_fim || undefined,
  frequenciaDiasSemana: (db as any).frequencia_dias_semana || undefined,
});

const Conteudo = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  
  const podeIncluir = canIncluir('Produção', 'Conteúdo');
  const podeAlterar = canAlterar('Produção', 'Conteúdo');
  const podeExcluir = canExcluir('Produção', 'Conteúdo');
  
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Conteudo | null>(null);
  const [items, setItems] = useState<Conteudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCloning, setIsCloning] = useState(false);

  const fetchConteudos = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('conteudos')
        .select(`
          *,
          centros_lucro:centro_lucro_id(nome),
          unidades_negocio:unidade_negocio_id(nome),
          tipos_gravacao:tipo_conteudo_id(nome),
          classificacoes:classificacao_id(nome),
          tabelas_preco:tabela_preco_id(nome)
        `)
        .order('descricao');

      // Filter by user's allowed unidades de negócio
      if (user?.unidadeIds && user.unidadeIds.length > 0) {
        query = query.in('unidade_negocio_id', user.unidadeIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems((data || []).map(mapDbToConteudo));
    } catch (error) {
      console.error('Error fetching conteudos:', error);
      toast({ title: t('common.error'), description: t('field.contentLoadError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConteudos();
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClone = async () => {
    if (selectedIds.size === 0) {
      toast({ title: t('common.warning') || 'Aviso', description: 'Selecione ao menos um registro para clonar.', variant: 'destructive' });
      return;
    }

    setIsCloning(true);
    try {
      for (const sourceId of selectedIds) {
        // 1. Fetch original conteudo
        const { data: original, error: fetchErr } = await supabase
          .from('conteudos')
          .select('*')
          .eq('id', sourceId)
          .single();
        if (fetchErr || !original) throw fetchErr || new Error('Not found');

        // 2. Insert clone
        const { id, created_at, updated_at, ...rest } = original;
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
        if (insertErr || !newConteudo) throw insertErr;

        // 3. Clone recursos físicos
        const { data: recursosFisicos } = await supabase
          .from('conteudo_recursos_fisicos')
          .select('*')
          .eq('conteudo_id', sourceId);
        if (recursosFisicos && recursosFisicos.length > 0) {
          const clonedRF = recursosFisicos.map(({ id, created_at, conteudo_id, ...r }) => ({
            ...r,
            conteudo_id: newConteudo.id,
          }));
          await supabase.from('conteudo_recursos_fisicos').insert(clonedRF);
        }

        // 4. Clone recursos técnicos
        const { data: recursosTecnicos } = await supabase
          .from('conteudo_recursos_tecnicos')
          .select('*')
          .eq('conteudo_id', sourceId);
        if (recursosTecnicos && recursosTecnicos.length > 0) {
          const clonedRT = recursosTecnicos.map(({ id, created_at, conteudo_id, ...r }) => ({
            ...r,
            conteudo_id: newConteudo.id,
          }));
          await supabase.from('conteudo_recursos_tecnicos').insert(clonedRT);
        }

        // 5. Clone terceiros
        const { data: terceiros } = await supabase
          .from('conteudo_terceiros')
          .select('*')
          .eq('conteudo_id', sourceId);
        if (terceiros && terceiros.length > 0) {
          const clonedT = terceiros.map(({ id, created_at, conteudo_id, ...r }) => ({
            ...r,
            conteudo_id: newConteudo.id,
          }));
          await supabase.from('conteudo_terceiros').insert(clonedT);
        }
      }

      toast({ title: t('common.success'), description: `${selectedIds.size} registro(s) clonado(s) com sucesso.` });
      setSelectedIds(new Set());
      await fetchConteudos();
    } catch (error) {
      console.error('Error cloning conteudo:', error);
      toast({ title: t('common.error'), description: 'Erro ao clonar registro.', variant: 'destructive' });
    } finally {
      setIsCloning(false);
    }
  };

  const handleSave = async (data: Conteudo) => {
    try {
      const [
        { data: unidadesData },
        { data: centrosData },
        { data: tiposData },
        { data: classificacoesData },
      ] = await Promise.all([
        supabase.from('unidades_negocio').select('id, nome'),
        supabase.from('centros_lucro').select('id, nome'),
        supabase.from('tipos_gravacao').select('id, nome'),
        supabase.from('classificacoes').select('id, nome'),
      ]);

      const unidadeId = (data.unidadeNegocio ? unidadesData?.find(u => u.nome === data.unidadeNegocio)?.id : null) || data.unidadeNegocioId || null;
      const centroId = (data.centroLucro ? centrosData?.find(c => c.nome === data.centroLucro)?.id : null) || data.centroLucroId || null;
      const tipoId = (data.tipoConteudo ? tiposData?.find(t => t.nome === data.tipoConteudo)?.id : null) || data.tipoConteudoId || null;
      const classificacaoId = (data.classificacao ? classificacoesData?.find(c => c.nome === data.classificacao)?.id : null) || data.classificacaoId || null;

      const dbData: any = {
        id: data.id || undefined,
        codigo_externo: data.codigoExterno || null,
        descricao: data.descricao,
        quantidade_episodios: data.quantidadeEpisodios || 0,
        centro_lucro_id: centroId,
        unidade_negocio_id: unidadeId,
        tipo_conteudo_id: tipoId,
        classificacao_id: classificacaoId,
        ano_producao: data.anoProducao || null,
        sinopse: data.sinopse || null,
        orcamento: (data as any).orcamento || 0,
        tabela_preco_id: data.tabelaPrecoId || null,
        frequencia_data_inicio: data.frequenciaDataInicio || null,
        frequencia_data_fim: data.frequenciaDataFim || null,
        frequencia_dias_semana: data.frequenciaDiasSemana && data.frequenciaDiasSemana.length > 0 ? data.frequenciaDiasSemana : null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('conteudos')
          .update(dbData as TablesUpdate<'conteudos'>)
          .eq('id', data.id);
        if (error) throw error;
        toast({ title: t('common.success'), description: t('field.contentUpdated') });
      } else {
        const { error } = await supabase.from('conteudos').insert(dbData);
        if (error) throw error;
        toast({ title: t('common.success'), description: t('field.contentCreated') });
      }

      await fetchConteudos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving conteudo:', error);
      toast({ title: t('common.error'), description: t('field.contentSaveError'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: gravacoes } = await supabase
        .from('gravacoes')
        .select('id')
        .eq('conteudo_id', id);

      if (gravacoes && gravacoes.length > 0) {
        const gravacaoIds = gravacoes.map(g => g.id);
        
        const { data: recursos } = await supabase
          .from('gravacao_recursos')
          .select('id')
          .in('gravacao_id', gravacaoIds)
          .limit(1);

        const { data: terceiros } = await supabase
          .from('gravacao_terceiros')
          .select('id')
          .in('gravacao_id', gravacaoIds)
          .limit(1);

        if ((recursos && recursos.length > 0) || (terceiros && terceiros.length > 0)) {
          toast({
            title: t('common.error'),
            description: t('field.contentDeleteBlocked'),
            variant: 'destructive',
          });
          return;
        }
      }

      if (confirm(t('field.confirmDeleteContent'))) {
        await supabase.from('gravacoes').delete().eq('conteudo_id', id);
        
        const { error } = await supabase.from('conteudos').delete().eq('id', id);
        if (error) throw error;
        toast({ title: t('common.deleted'), description: t('field.contentDeleted') });
        await fetchConteudos();
      }
    } catch (error) {
      console.error('Error deleting conteudo:', error);
      toast({ title: t('common.error'), description: t('field.contentDeleteError'), variant: 'destructive' });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
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
          onClick={(e) => e.stopPropagation()}
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
      render: (item) => (
        <span className="font-mono">{item.quantidadeEpisodios}</span>
      ),
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
      <PageHeader
        title={t('content.title')}
        description={t('content.description')}
      />
      
      <ListActionBar>
        {podeIncluir && (
          <NewButton tooltip={t('content.new')} onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />
        )}
        {podeIncluir && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleClone}
                  disabled={selectedIds.size === 0 || isCloning}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
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
