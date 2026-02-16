import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Plus, Trash2, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';

interface EquipeData {
  id?: string;
  codigo: string;
  descricao: string;
}

interface RecursoHumano {
  id: string;
  nome: string;
  sobrenome: string;
  funcao_nome?: string;
}

interface Membro {
  id: string;
  recursoHumanoId: string;
  dataAssociacao: string;
}

interface EquipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EquipeData) => void;
  data?: { id: string; codigo: string; descricao: string } | null;
  onRefresh?: () => void;
  readOnly?: boolean;
}

const emptyFormData: EquipeData = {
  codigo: '',
  descricao: '',
};

export const EquipeFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  onRefresh,
  readOnly = false,
}: EquipeFormModalProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isVisible } = usePermissions();
  const { getAsterisk } = useFormFieldConfig('equipe');
  const [formData, setFormData] = useState<EquipeData>(emptyFormData);
  const [isAddingMembro, setIsAddingMembro] = useState(false);
  const [selectedRHId, setSelectedRHId] = useState('');
  const [membros, setMembros] = useState<Membro[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [isLoadingRH, setIsLoadingRH] = useState(false);

  const fetchRecursosHumanos = useCallback(async () => {
    setIsLoadingRH(true);
    try {
      const { data: rhData, error } = await supabase
        .from('recursos_humanos')
        .select('id, nome, sobrenome, funcao_id, funcoes(nome)')
        .eq('status', 'Ativo')
        .order('nome');

      if (error) throw error;
      setRecursosHumanos(
        (rhData || []).map((rh: any) => ({
          id: rh.id,
          nome: rh.nome,
          sobrenome: rh.sobrenome,
          funcao_nome: rh.funcoes?.nome || '',
        }))
      );
    } catch (err) {
      console.error('Erro ao carregar recursos humanos:', err);
    } finally {
      setIsLoadingRH(false);
    }
  }, []);

  const fetchMembros = useCallback(async (equipeId: string) => {
    try {
      const { data: membrosData, error } = await supabase
        .from('equipe_membros')
        .select('id, recurso_humano_id, created_at')
        .eq('equipe_id', equipeId);

      if (error) throw error;
      setMembros(
        (membrosData || []).map((m) => ({
          id: m.id,
          recursoHumanoId: m.recurso_humano_id,
          dataAssociacao: m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : '',
        }))
      );
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(data ? { id: data.id, codigo: data.codigo, descricao: data.descricao } : { ...emptyFormData });
      setIsAddingMembro(false);
      setSelectedRHId('');
      fetchRecursosHumanos();
      if (data?.id) {
        fetchMembros(data.id);
      } else {
        setMembros([]);
      }
    }
  }, [isOpen, data, fetchRecursosHumanos, fetchMembros]);

  const rhDisponiveis = useMemo(() => {
    const membroIds = membros.map((m) => m.recursoHumanoId);
    return recursosHumanos.filter((rh) => !membroIds.includes(rh.id));
  }, [recursosHumanos, membros]);

  const dadosTabelaMembros = useMemo(() => {
    return membros.map((m) => {
      const rh = recursosHumanos.find((r) => r.id === m.recursoHumanoId);
      return {
        id: m.id,
        recursoHumanoId: m.recursoHumanoId,
        nome: rh ? `${rh.nome} ${rh.sobrenome}` : t('teams.memberNotFound'),
        funcao: rh?.funcao_nome || '-',
        dataAssociacao: m.dataAssociacao,
      };
    });
  }, [membros, recursosHumanos, t]);

  const handleAddMembro = async () => {
    if (!selectedRHId) {
      toast({ title: t('common.error'), description: t('teams.selectMember'), variant: 'destructive' });
      return;
    }
    if (!data?.id) {
      toast({ title: t('common.error'), description: t('teams.saveFirst'), variant: 'destructive' });
      return;
    }
    try {
      const { data: inserted, error } = await supabase
        .from('equipe_membros')
        .insert({ equipe_id: data.id, recurso_humano_id: selectedRHId })
        .select()
        .single();

      if (error) throw error;
      setMembros([...membros, {
        id: inserted.id,
        recursoHumanoId: inserted.recurso_humano_id,
        dataAssociacao: new Date().toLocaleDateString('pt-BR'),
      }]);
      toast({ title: t('common.success'), description: t('teams.memberAdded') });
      setSelectedRHId('');
      setIsAddingMembro(false);
      onRefresh?.();
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      toast({ title: t('common.error'), description: t('teams.memberAddError'), variant: 'destructive' });
    }
  };

  const handleRemoveMembro = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;
    try {
      const { error } = await supabase.from('equipe_membros').delete().eq('id', id);
      if (error) throw error;
      setMembros(membros.filter((m) => m.id !== id));
      toast({ title: t('common.deleted'), description: t('teams.memberRemoved') });
      onRefresh?.();
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      toast({ title: t('common.error'), description: t('teams.memberRemoveError'), variant: 'destructive' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.descricao.trim()) {
      toast({ title: t('common.error'), description: t('common.required'), variant: 'destructive' });
      return;
    }
    onSave(formData);
    onClose();
  };

  const columnsMembros: Column<typeof dadosTabelaMembros[0] & { actions?: never }>[] = [
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.nome}</span>
        </div>
      ),
    },
    {
      key: 'funcao',
      label: t('teams.function'),
      className: 'hidden md:table-cell',
      render: (item) => <span className="text-muted-foreground">{item.funcao}</span>,
    },
    {
      key: 'dataAssociacao',
      label: t('common.date'),
      className: 'w-32',
    },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-20 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => handleRemoveMembro(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? t('teams.edit') : t('teams.new')}</DialogTitle>
          <DialogDescription>
            {data ? t('teams.editDescription') : t('teams.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">{t('common.code')} <FieldAsterisk type={getAsterisk('codigo')} /></Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                maxLength={20}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">{t('common.description')} <FieldAsterisk type={getAsterisk('descricao')} /></Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                maxLength={100}
                required
              />
            </div>
          </div>

          {data && (
            <div className="pt-4 border-t">
              <Tabs defaultValue="membros" className="w-full">
                {isVisible('Recursos', 'Equipes', '-', 'Tabulador "Membros"') && (
                <>
                <TabsList>
                  <TabsTrigger value="membros" className="gap-2">
                    <Users className="h-4 w-4" />
                    {t('teams.members')} ({dadosTabelaMembros.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="membros" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{t('teams.membersList')}</h3>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddingMembro(true)}
                      disabled={rhDisponiveis.length === 0 || isLoadingRH}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('teams.addMember')}
                    </Button>
                  </div>

                  {isAddingMembro && (
                    <div className="flex gap-2 mb-4 p-3 border rounded-lg bg-muted/30">
                      <Select value={selectedRHId} onValueChange={setSelectedRHId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={t('teams.selectMemberPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {rhDisponiveis.map((rh) => (
                            <SelectItem key={rh.id} value={rh.id}>
                              {rh.nome} {rh.sobrenome} {rh.funcao_nome ? `(${rh.funcao_nome})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={handleAddMembro} disabled={!selectedRHId}>
                        {t('common.add')}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsAddingMembro(false);
                        setSelectedRHId('');
                      }}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  )}

                  {isLoadingRH ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : dadosTabelaMembros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-muted/20">
                      <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">{t('teams.noMembers')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t('teams.addMemberHint')}</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden max-h-[250px] overflow-y-auto">
                      <SortableTable
                        data={dadosTabelaMembros}
                        columns={columnsMembros}
                        getRowKey={(item) => item.id}
                        storageKey={`equipe_membros_${data.id}`}
                      />
                    </div>
                  )}
                </TabsContent>
                </>
                )}
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {readOnly ? 'Fechar' : t('common.cancel')}
            </Button>
            {!readOnly && (
              <Button type="submit" className="gradient-primary hover:opacity-90">
                {t('common.save')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EquipeFormModal;
