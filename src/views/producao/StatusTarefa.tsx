import { useCallback, useEffect, useState } from 'react';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Settings, Edit, Trash2, Loader2, Star } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';

interface StatusTarefaItem {
  id: string;
  codigo: string;
  nome: string;
  cor: string;
  descricao: string;
  isInicial: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
}

const repository = new ApiParametrizacoesRepository();

const StatusTarefa = () => {
  const { t } = useLanguage();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<StatusTarefaItem[]>([]);
  const [editingItem, setEditingItem] = useState<StatusTarefaItem | null>(null);
  const [formData, setFormData] = useState<Partial<StatusTarefaItem>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listStatusTarefa();
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching status_tarefa:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleOpenModal = (item?: StatusTarefaItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ cor: '#888888' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.codigo || !formData.nome) {
      toast.error(t('common.requiredFields'));
      return;
    }

    try {
      await repository.saveStatusTarefa({
        ...(editingItem ? { id: editingItem.id } : {}),
        codigo: formData.codigo,
        nome: formData.nome,
        cor: formData.cor || '#888888',
        descricao: formData.descricao || '',
        isInicial: editingItem?.isInicial || false,
      });

      toast.success(t('common.savedSuccessfully'));
      await fetchData();
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({});
    } catch (err) {
      console.error('Error saving status_tarefa:', err);
      toast.error('Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await repository.removeStatusTarefa(id);
      toast.success(t('common.deleted'));
      await fetchData();
    } catch (err) {
      console.error('Error deleting status_tarefa:', err);
      toast.error('Erro ao excluir');
    }
  };

  const handleToggleInicial = async (id: string, value: boolean) => {
    try {
      await repository.toggleStatusTarefaInicial(id, value);
      toast.success(value ? 'Status definido como inicial' : 'Status inicial removido');
      await fetchData();
    } catch (err) {
      console.error('Error toggling is_inicial:', err);
      toast.error('Erro ao atualizar');
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigo.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t('parameters.taskStatus')}
        description={t('parameters.taskStatusDescription')}
      />

      <ListActionBar>
        <NewButton tooltip={t('common.new')} onClick={() => handleOpenModal()} />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </ListActionBar>

      {filteredItems.length === 0 ? (
        <EmptyState
          title={t('common.noResults')}
          description={t('parameters.taskStatusDescription')}
          icon={Settings}
          onAction={() => handleOpenModal()}
          actionLabel={t('common.add')}
        />
      ) : (
        <DataCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.code')}</TableHead>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.color')}</TableHead>
                <TableHead>{t('common.description')}</TableHead>
                <TableHead className="w-[80px] text-center">Inicial</TableHead>
                <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.codigo}</TableCell>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: item.cor || '#888' }}
                      />
                      {item.cor}
                    </div>
                  </TableCell>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => void handleToggleInicial(item.id, !item.isInicial)}
                          >
                            <Star
                              className={`h-4 w-4 ${item.isInicial ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {item.isInicial ? 'Status inicial ativo' : 'Definir como status inicial'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('common.confirm.delete')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('common.deleteConfirmation')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDelete(item.id)}>
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('common.edit') : t('common.new')} {t('parameters.taskStatus')}
            </DialogTitle>
            <DialogDescription>{t('parameters.taskStatusDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">{t('common.code')} *</Label>
              <Input
                id="codigo"
                value={formData.codigo || ''}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                required
                disabled={
                  !!editingItem && !canAlterar('ProduÃ§Ã£o', 'ParametrizaÃ§Ãµes', 'Status Tarefa')
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">{t('common.name')} *</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                disabled={
                  !!editingItem && !canAlterar('ProduÃ§Ã£o', 'ParametrizaÃ§Ãµes', 'Status Tarefa')
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor">{t('common.color')}</Label>
              <div className="flex gap-2">
                <Input
                  id="cor"
                  type="color"
                  value={formData.cor || '#888888'}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="w-16 h-10 p-1"
                  disabled={
                    !!editingItem && !canAlterar('ProduÃ§Ã£o', 'ParametrizaÃ§Ãµes', 'Status Tarefa')
                  }
                />
                <Input
                  value={formData.cor || ''}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                  disabled={
                    !!editingItem && !canAlterar('ProduÃ§Ã£o', 'ParametrizaÃ§Ãµes', 'Status Tarefa')
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">{t('common.description')}</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                disabled={
                  !!editingItem && !canAlterar('ProduÃ§Ã£o', 'ParametrizaÃ§Ãµes', 'Status Tarefa')
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              {editingItem && !canAlterar('ProduÃ§Ã£o', 'ParametrizaÃ§Ãµes', 'Status Tarefa')
                ? t('common.close')
                : t('common.cancel')}
            </Button>
            {!(editingItem && !canAlterar('ProduÃ§Ã£o', 'ParametrizaÃ§Ãµes', 'Status Tarefa')) && (
              <Button onClick={() => void handleSave()} className="gradient-primary">
                {t('common.save')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StatusTarefa;
