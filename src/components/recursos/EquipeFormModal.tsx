import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Plus, Trash2, Users, Loader2 } from 'lucide-react';
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';
import { equipesRepository } from '@/modules/equipes/equipes.repository';
import type { EquipeInput, Membro, RecursoHumano } from '@/modules/equipes/equipes.types';

interface EquipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EquipeInput) => void;
  data?: { id: string; codigo: string; descricao: string } | null;
  onRefresh?: () => void;
  readOnly?: boolean;
}

const emptyFormData: EquipeInput = {
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
  const [formData, setFormData] = useState<EquipeInput>(emptyFormData);
  const [isAddingMembro, setIsAddingMembro] = useState(false);
  const [selectedRHId, setSelectedRHId] = useState('');
  const [membros, setMembros] = useState<Membro[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [isLoadingRH, setIsLoadingRH] = useState(false);

  const fetchRecursosHumanos = useCallback(async () => {
    setIsLoadingRH(true);
    try {
      setRecursosHumanos(await equipesRepository.listRecursosHumanosAtivos());
    } catch (error) {
      console.error('Erro ao carregar recursos humanos:', error);
    } finally {
      setIsLoadingRH(false);
    }
  }, []);

  const fetchMembros = useCallback(async (equipeId: string) => {
    try {
      setMembros(await equipesRepository.listMembros(equipeId));
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setFormData(data ? { id: data.id, codigo: data.codigo, descricao: data.descricao } : { ...emptyFormData });
    setIsAddingMembro(false);
    setSelectedRHId('');
    fetchRecursosHumanos();

    if (data?.id) {
      fetchMembros(data.id);
    } else {
      setMembros([]);
    }
  }, [isOpen, data, fetchMembros, fetchRecursosHumanos]);

  const rhDisponiveis = useMemo(() => {
    const membroIds = membros.map((membro) => membro.recursoHumanoId);
    return recursosHumanos.filter((rh) => !membroIds.includes(rh.id));
  }, [recursosHumanos, membros]);

  const dadosTabelaMembros = useMemo(
    () =>
      membros.map((membro) => {
        const rh = recursosHumanos.find((item) => item.id === membro.recursoHumanoId);

        return {
          id: membro.id,
          recursoHumanoId: membro.recursoHumanoId,
          nome: rh ? `${rh.nome} ${rh.sobrenome}` : t('teams.memberNotFound'),
          funcao: rh?.funcao_nome || '-',
          dataAssociacao: membro.dataAssociacao,
        };
      }),
    [membros, recursosHumanos, t],
  );

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
      const inserted = await equipesRepository.addMembro(data.id, selectedRHId);
      setMembros([...membros, inserted]);
      toast({ title: t('common.success'), description: t('teams.memberAdded') });
      setSelectedRHId('');
      setIsAddingMembro(false);
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      toast({ title: t('common.error'), description: t('teams.memberAddError'), variant: 'destructive' });
    }
  };

  const handleRemoveMembro = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;

    try {
      await equipesRepository.removeMembro(id);
      setMembros(membros.filter((membro) => membro.id !== id));
      toast({ title: t('common.deleted'), description: t('teams.memberRemoved') });
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast({ title: t('common.error'), description: t('teams.memberRemoveError'), variant: 'destructive' });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.codigo.trim() || !formData.descricao.trim()) {
      toast({ title: t('common.error'), description: t('common.required'), variant: 'destructive' });
      return;
    }

    onSave(formData);
    onClose();
  };

  const columnsMembros: Column<(typeof dadosTabelaMembros)[number] & { actions?: never }>[] = [
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
              <Label htmlFor="codigo">
                {t('common.code')} <FieldAsterisk type={getAsterisk('codigo')} />
              </Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(event) => setFormData({ ...formData, codigo: event.target.value })}
                maxLength={20}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">
                {t('common.description')} <FieldAsterisk type={getAsterisk('descricao')} />
              </Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(event) => setFormData({ ...formData, descricao: event.target.value })}
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
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddingMembro(false);
                              setSelectedRHId('');
                            }}
                          >
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
