import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Edit, Trash2, UserCog, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { UsuarioFormModal } from '@/components/admin/UsuarioFormModal';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ApiUsuariosRepository } from '@/modules/usuarios/usuarios.api.repository';
import { useAuth } from '@/contexts/AuthContext';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { isPasswordPolicyValid, PASSWORD_POLICY_MESSAGE } from '@/lib/password-policy';

export interface Usuario {
  id: string;
  codigoExterno: string;
  nome: string;
  email: string;
  usuario: string;
  senha: string;
  foto?: string;
  perfil: string;
  perfilId?: string;
  descricao: string;
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  tipoAcesso: string;
  recursoHumanoId?: string;
  dataCadastro: string;
  usuarioCadastro: string;
  tenantId?: string | null;
  role?: 'GLOBAL_ADMIN' | 'TENANT_ADMIN' | 'USER';
}

const apiRepository = new ApiUsuariosRepository();

const STORAGE_KEY = 'kreato_usuarios_table';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'foto', label: 'Foto', defaultVisible: true },
  { key: 'codigoExterno', label: 'Código', defaultVisible: true },
  { key: 'nome', label: 'Nome', required: true },
  { key: 'usuario', label: 'Usuário', defaultVisible: true },
  { key: 'email', label: 'E-mail', defaultVisible: true },
  { key: 'perfil', label: 'Perfil', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'acoes', label: 'Ações', required: true },
];

// ─── Card renderer ────────────────────────────────────────────────────────────

function UsuarioCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Usuario;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = item.nome
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={item.foto || undefined} alt={item.nome} />
            <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
            <p className="text-xs text-muted-foreground truncate">{item.email}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1 text-xs text-muted-foreground">
        {item.perfil && <div>{item.perfil}</div>}
        <Badge
          variant={item.status === 'Ativo' ? 'default' : 'secondary'}
          className="text-[10px] h-4 px-1.5"
        >
          {item.status}
        </Badge>
      </CardContent>

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
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

function UsuarioDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: Usuario;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = item.nome
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const field = (label: string, value: string | undefined | null) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={item.foto || undefined} alt={item.nome} />
          <AvatarFallback className="text-sm bg-muted">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
          <Badge
            variant={item.status === 'Ativo' ? 'default' : 'secondary'}
            className="text-[10px] h-4 px-1.5 mt-1"
          >
            {item.status}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Usuário', item.usuario)}
        {field('E-mail', item.email)}
        {field('Perfil', item.perfil)}
        {field('Data de Cadastro', item.dataCadastro)}
      </div>

      <Separator />

      <div className="flex gap-2">
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

const Usuarios = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Usuario | null>(null);
  const [items, setItems] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const fetchData = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const data = await apiRepository.list();
      setItems(
        data
          .map(
            (item): Usuario => ({
              id: item.id || '',
              codigoExterno: item.codigoExterno || '',
              nome: item.nome,
              email: item.email,
              usuario: item.usuario,
              senha: '',
              foto: item.foto,
              perfil: item.perfil || '',
              perfilId: undefined,
              descricao: item.descricao || '',
              status: item.status || 'Ativo',
              tipoAcesso: item.tipoAcesso || 'Operacional',
              recursoHumanoId: item.recursoHumanoId || undefined,
              dataCadastro: item.dataCadastro,
              usuarioCadastro: item.usuarioCadastro || '',
              tenantId: item.tenantId ?? null,
              role: item.role,
            }),
          )
          .filter((item) => item.role !== 'GLOBAL_ADMIN'),
      );
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuarios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSave = async (data: Usuario) => {
    try {
      if (!data.email || !data.nome || !data.usuario) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatorios',
          variant: 'destructive',
        });
        return;
      }

      if (!editingItem && !data.senha) {
        toast({
          title: 'Erro',
          description: 'Preencha todos os campos obrigatorios',
          variant: 'destructive',
        });
        return;
      }

      if (data.senha && !isPasswordPolicyValid(data.senha)) {
        toast({
          title: 'Erro',
          description: PASSWORD_POLICY_MESSAGE,
          variant: 'destructive',
        });
        return;
      }

      await apiRepository.save({
        ...(editingItem ? { id: data.id } : {}),
        codigoExterno: data.codigoExterno || '',
        nome: data.nome,
        email: data.email,
        usuario: data.usuario,
        ...(data.senha ? { senha: data.senha } : {}),
        foto: data.foto || '',
        perfil: data.perfil || '',
        descricao: data.descricao || '',
        status: data.status || 'Ativo',
        tipoAcesso: data.tipoAcesso || 'Operacional',
        recursoHumanoId: data.recursoHumanoId || undefined,
        tenantId: data.tenantId ?? null,
        role: data.role,
        dataCadastro: data.dataCadastro,
        usuarioCadastro: data.usuarioCadastro,
      });

      toast({
        title: 'Sucesso',
        description: editingItem ? 'Usuario atualizado!' : 'Usuario criado com sucesso!',
      });

      await fetchData();
      setEditingItem(null);
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error('Error saving user:', err);
      toast({
        title: 'Erro',
        description: (err as Error).message || 'Erro ao salvar usuario',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await apiRepository.remove(deletingId);
      toast({ title: 'Sucesso', description: 'Usuario excluido!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir usuario',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.usuario.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Usuario>[] = [
    {
      key: 'foto',
      label: 'Foto',
      className: 'w-16',
      sortable: false,
      render: (item) => (
        <Avatar className="h-9 w-9">
          <AvatarImage src={item.foto || undefined} alt={item.nome} />
          <AvatarFallback className="text-xs bg-muted">
            {getInitials(item.nome || '??')}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: 'codigoExterno',
      label: 'Codigo',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'usuario',
      label: 'Usuario',
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'perfil',
      label: 'Perfil',
      render: (item) => item.perfil || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>{item.status}</Badge>
      ),
    },
    {
      key: 'acoes',
      label: 'Acoes',
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
          <Button
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              setDeletingId(item.id);
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
      <PageHeader title="Usuarios" description="Gerencie os usuarios do sistema" />

      <ListActionBar>
        <NewButton
          tooltip="Novo Usuario"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
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
              title="Nenhum usuario cadastrado"
              description="Adicione usuarios para gerenciar o acesso ao sistema."
              icon={UserCog}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Usuario"
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
            emptyTitle="Nenhum usuario cadastrado"
            emptyDescription="Adicione usuarios para gerenciar o acesso ao sistema."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Usuario"
            renderCard={(item) => (
              <UsuarioCard
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Detalhe do Usuário"
            emptyDetailTitle="Nenhum usuário selecionado"
            emptyDetailDescription="Clique em um usuário na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={item.foto || undefined} alt={item.nome} />
                  <AvatarFallback className="text-xs bg-muted">
                    {getInitials(item.nome || '??')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.nome}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <UsuarioDetailPanel
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
              />
            )}
          />
        )}
      </DataCard>

      <UsuarioFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        showTenantSelector
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
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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

export default Usuarios;
