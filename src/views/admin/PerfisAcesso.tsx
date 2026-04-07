import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Copy, FileText, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import PerfilFormModal from '@/components/admin/PerfilFormModal';
import {
  clonePermissionsAsync,
  createDefaultPermissions,
  getPerfilPermissionsAsync,
  savePerfilPermissionsAsync,
} from '@/data/permissionsMatrix';
import { useAuth } from '@/contexts/AuthContext';
import { ApiParametrosRepository } from '@/modules/parametros/parametros.api.repository';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

interface PerfilDb {
  id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  created_at: string | null;
  created_by: string | null;
}

interface Perfil {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const apiRepository = new ApiParametrosRepository();

const STORAGE_KEY = 'kreato_perfis_acesso';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno',   label: 'Código',         defaultVisible: true },
  { key: 'nome',            label: 'Nome',           required: true },
  { key: 'descricao',       label: 'Descrição',      defaultVisible: true },
  { key: 'dataCadastro',    label: 'Data Cadastro',  defaultVisible: false },
  { key: 'usuarioCadastro', label: 'Usuário',        defaultVisible: false },
  { key: 'actions',         label: 'Ações',          required: true },
];

const mapDbToPerfil = (db: PerfilDb, userName: string): Perfil => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  nome: db.nome,
  descricao: db.descricao || '',
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: userName,
});

// ─── Card renderer ────────────────────────────────────────────────────────────

function PerfilCard({
  item,
  onEdit,
  onDelete,
  onCopy,
  onExportPDF,
}: {
  item: Perfil;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onExportPDF: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="min-w-0">
          <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
      </CardHeader>

      {item.descricao && (
        <CardContent className="px-4 pb-3 flex-1 text-xs text-muted-foreground">
          <p className="line-clamp-3">{item.descricao}</p>
        </CardContent>
      )}

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1 mt-auto">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onCopy} title="Copiar Perfil">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onExportPDF} title="Exportar PDF">
          <FileText className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Detail panel renderer ────────────────────────────────────────────────────

function PerfilDetailPanel({
  item,
  onEdit,
  onDelete,
  onCopy,
  onExportPDF,
}: {
  item: Perfil;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onExportPDF: () => void;
}) {
  const field = (label: string, value: string | undefined | null) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
        {item.codigoExterno && (
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Data de Cadastro', item.dataCadastro)}
        {field('Usuário', item.usuarioCadastro)}
      </div>

      {item.descricao && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descrição</p>
            <p className="text-sm leading-relaxed">{item.descricao}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          Copiar
        </Button>
        <Button size="sm" variant="outline" onClick={onExportPDF}>
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          Exportar PDF
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PerfisAcesso = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Perfil | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Perfil | null>(null);
  const [items, setItems] = useState<Perfil[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRepository.list('kreato_perfis_acesso');
      setItems((data || []).map((item) => mapDbToPerfil(item, user?.nome || '')));
    } catch (error) {
      console.error('Error fetching perfis_acesso:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar dados: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, user?.nome]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSave = async (data: Perfil) => {
    try {
      await apiRepository.save('kreato_perfis_acesso', {
        ...(editingItem ? { id: data.id } : {}),
        codigoExterno: data.codigoExterno || '',
        nome: data.nome,
        descricao: data.descricao || '',
      });

      toast({
        title: t('common.success'),
        description: editingItem
          ? `Perfil ${t('common.updated').toLowerCase()}!`
          : `Perfil ${t('common.save').toLowerCase()}!`,
      });

      await fetchData();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving perfil:', error);
      toast({
        title: 'Erro',
        description: `Erro ao salvar: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await apiRepository.remove('kreato_perfis_acesso', deletingId);
      toast({
        title: t('common.deleted'),
        description: `Perfil ${t('common.deleted').toLowerCase()}!`,
      });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting perfil:', error);
      toast({
        title: 'Erro',
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (item: Perfil) => {
    try {
      const newPerfil = await apiRepository.save('kreato_perfis_acesso', {
        codigoExterno: '',
        nome: `${item.nome} (Cópia)`,
        descricao: item.descricao || '',
      });

      const clonedPermissions = await clonePermissionsAsync(item.id, newPerfil.id);
      if (clonedPermissions) {
        await savePerfilPermissionsAsync(clonedPermissions);
      } else {
        await savePerfilPermissionsAsync(createDefaultPermissions(newPerfil.id));
      }

      await fetchData();
      toast({
        title: t('common.success'),
        description: `Perfil "${item.nome}" copiado com sucesso!`,
      });
    } catch (error) {
      console.error('Error copying perfil:', error);
      toast({
        title: 'Erro',
        description: `Erro ao copiar: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = async (item: Perfil) => {
    try {
      let permissions = await getPerfilPermissionsAsync(item.id);

      if (!permissions) {
        permissions = createDefaultPermissions(item.id);
        await savePerfilPermissionsAsync(permissions);
      }

      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;
      const lineHeight = 6;
      const margin = 14;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Mapa de Permissões de Acesso', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(14);
      doc.text(`Perfil: ${item.nome}`, margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPosition);
      yPosition += 12;

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      const colWidths = [45, 35, 35, 30, 12, 12, 12, 12, 12];
      const headers = ['Módulo', 'Sub-módulo 1', 'Sub-módulo 2', 'Campo', 'Ação', 'Leit.', 'Incl.', 'Alt.', 'Excl.'];
      let xPos = margin;

      headers.forEach((header, index) => {
        doc.text(header, xPos + 1, yPosition);
        xPos += colWidths[index];
      });

      yPosition += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      permissions.permissoes.forEach((perm) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }

        xPos = margin;
        const data = [
          perm.modulo.substring(0, 20),
          perm.subModulo1 === '-' ? '' : perm.subModulo1.substring(0, 15),
          perm.subModulo2 === '-' ? '' : perm.subModulo2.substring(0, 15),
          perm.campo === '-' ? '' : perm.campo.substring(0, 15),
          perm.acao === 'visible' ? 'V' : 'I',
          perm.tipo === 'campo' ? (perm.somenteLeitura ? 'S' : 'N') : '',
          perm.tipo === 'campo' ? (perm.incluir ? 'S' : 'N') : '',
          perm.tipo === 'campo' ? (perm.alterar ? 'S' : 'N') : '',
          perm.tipo === 'campo' ? (perm.excluir ? 'S' : 'N') : '',
        ];

        doc.setFont('helvetica', perm.tipo === 'modulo' ? 'bold' : 'normal');

        data.forEach((text, index) => {
          doc.text(text, xPos + 1, yPosition);
          xPos += colWidths[index];
        });

        yPosition += lineHeight;
      });

      yPosition += 5;
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Legenda:', margin, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      doc.text('V = Visível | I = Invisível | S = Sim | N = Não', margin, yPosition);

      doc.save(`permissoes_${item.nome.replace(/\s+/g, '_').toLowerCase()}.pdf`);

      toast({
        title: t('common.success'),
        description: 'PDF das permissões exportado com sucesso!',
      });
    } catch (error) {
      console.error('Error exporting perfil PDF:', error);
      toast({
        title: 'Erro',
        description: `Erro ao exportar PDF: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Perfil & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'descricao',
      label: t('common.description'),
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
      className: 'w-32',
    },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-36 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => void handleCopy(item)}
            title="Copiar Perfil"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => void handleExportPDF(item)}
            title="Exportar PDF"
          >
            <FileText className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeletingId(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Perfis de Acesso" description="Gerencie os perfis de acesso do sistema" />

      <ListActionBar>
        <NewButton
          tooltip={`${t('common.new')} Perfil`}
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
        {mode === 'list' && (
          <ColumnSelector
            columns={optionalColumns}
            visibleColumnKeys={visibleColumnKeys}
            onToggle={toggleColumn}
            onReset={resetColumns}
          />
        )}
        <ViewSwitcher mode={mode} onModeChange={setMode} />
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title={t('common.noResults')}
              description={`${t('common.add')} perfil.`}
              icon={Settings}
              onAction={() => setIsModalOpen(true)}
              actionLabel={`${t('common.add')} Perfil`}
            />
          ) : (
            <SortableTable
              data={filteredItems}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={visibleColumnKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle={t('common.noResults')}
            emptyDescription={`${t('common.add')} perfil.`}
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel={`${t('common.add')} Perfil`}
            renderCard={(item) => (
              <PerfilCard
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onCopy={() => void handleCopy(item)}
                onExportPDF={() => void handleExportPDF(item)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Detalhe do Perfil"
            emptyDetailTitle="Nenhum perfil selecionado"
            emptyDetailDescription="Clique em um perfil na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
                {item.codigoExterno && (
                  <p className="text-xs font-mono text-muted-foreground">{item.codigoExterno}</p>
                )}
              </div>
            )}
            renderDetail={(item) => (
              <PerfilDetailPanel
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onCopy={() => void handleCopy(item)}
                onExportPDF={() => void handleExportPDF(item)}
              />
            )}
          />
        )}
      </DataCard>

      <PerfilFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        navigation={(() => {
          const navIndex = editingItem
            ? filteredItems.findIndex((i) => i.id === editingItem.id)
            : -1;
          return navIndex >= 0
            ? {
                currentIndex: navIndex,
                total: filteredItems.length,
                onPrevious: () => setEditingItem(filteredItems[navIndex - 1]),
                onNext: () => setEditingItem(filteredItems[navIndex + 1]),
              }
            : undefined;
        })()}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PerfisAcesso;
