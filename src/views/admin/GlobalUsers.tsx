import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardFooter, CardHeader,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Globe, Loader2, Key } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Usuario } from './Usuarios';
import { UsuarioFormModal } from '@/components/admin/UsuarioFormModal';
import { ApiUsuariosRepository } from '@/modules/usuarios/usuarios.api.repository';
import { type UsuarioApiModel } from '@/modules/usuarios/usuarios.types';
import { useAuth } from '@/contexts/AuthContext';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const apiRepository = new ApiUsuariosRepository();

const STORAGE_KEY = 'kreato_global_users_table';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'foto',    label: 'Foto',     defaultVisible: true },
  { key: 'nome',    label: 'Nome',     required: true },
  { key: 'usuario', label: 'Usuário',  defaultVisible: true },
  { key: 'email',   label: 'E-mail',   defaultVisible: true },
  { key: 'status',  label: 'Status',   defaultVisible: true },
  { key: 'acoes',   label: 'Ações',    required: true },
];

const mapToGlobalUser = (item: UsuarioApiModel): Usuario => ({
  id: item.id,
  codigoExterno: item.codigoExterno || '',
  nome: item.nome,
  email: item.email,
  usuario: item.usuario,
  senha: '',
  foto: item.foto,
  perfil: item.perfil || 'Admin Global',
  perfilId: undefined,
  descricao: item.descricao || '',
  status: item.status || 'Ativo',
  tipoAcesso: 'Global',
  recursoHumanoId: undefined,
  dataCadastro: item.dataCadastro || '',
  usuarioCadastro: item.usuarioCadastro || '',
  role: 'GLOBAL_ADMIN',
});

// ─── Card renderer ────────────────────────────────────────────────────────────

function GlobalUserCard({
  item,
  onEdit,
}: {
  item: Usuario;
  onEdit: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 shrink-0 border-2 border-kreato-cyan">
            <AvatarImage src={item.foto || undefined} alt={item.nome} />
            <AvatarFallback className="text-xs bg-kreato-cyan/10 text-kreato-cyan">
              {item.nome.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
            <p className="text-xs text-muted-foreground truncate">{item.email}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Key className="h-3 w-3 shrink-0" />
          <span className="font-mono truncate">{item.usuario}</span>
        </div>
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5 mt-1.5">
          {item.status}
        </Badge>
      </CardContent>

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Detail panel renderer ────────────────────────────────────────────────────

function GlobalUserDetailPanel({
  item,
  onEdit,
}: {
  item: Usuario;
  onEdit: () => void;
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
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 border-2 border-kreato-cyan">
          <AvatarImage src={item.foto || undefined} alt={item.nome} />
          <AvatarFallback className="text-sm bg-kreato-cyan/10 text-kreato-cyan">
            {item.nome.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
          <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5 mt-1">
            {item.status}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Usuário', item.usuario)}
        {field('E-mail', item.email)}
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const GlobalUsers = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | null>(null);
  const [selectedItem, setSelectedItem] = useState<Usuario | null>(null);
  const [items, setItems] = useState<Usuario[]>([]);
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
      const data = await apiRepository.list();
      setItems(data.filter((item) => item.role === 'GLOBAL_ADMIN').map(mapToGlobalUser));
    } catch (error) {
      console.error('Error fetching global users:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários globais',
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
          description: 'Preencha todos os campos obrigatórios',
          variant: 'destructive',
        });
        return;
      }

      if (!editingItem && (!data.senha || data.senha.length < 6)) {
        toast({
          title: 'Erro',
          description: 'A senha deve ter pelo menos 6 caracteres',
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
        perfil: data.perfil || 'Admin Global',
        descricao: data.descricao || '',
        status: data.status || 'Ativo',
        tipoAcesso: 'Global',
        role: 'GLOBAL_ADMIN',
        dataCadastro: data.dataCadastro,
        usuarioCadastro: data.usuarioCadastro,
      });

      toast({
        title: 'Sucesso',
        description: editingItem ? 'Admin global atualizado!' : 'Admin global criado com sucesso!',
      });

      await fetchData();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error: unknown) {
      console.error('Error saving global user:', error);
      toast({
        title: 'Erro',
        description: (error as Error).message || 'Erro ao salvar admin global',
        variant: 'destructive',
      });
      throw error;
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
        <Avatar className="h-9 w-9 border-2 border-kreato-cyan">
          <AvatarImage src={item.foto || undefined} alt={item.nome} />
          <AvatarFallback className="text-xs bg-kreato-cyan/10 text-kreato-cyan">
            {item.nome.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'usuario',
      label: 'Usuário',
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Key className="h-3 w-3 text-muted-foreground" />
          {item.usuario}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'E-mail',
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
      label: 'Ações',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              if (item.usuario === 'admin_global') {
                toast({ description: 'O usuário root não pode ser editado aqui.' });
                return;
              }
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Usuários Globais"
        description="Administradores com acesso a todos os tenants"
      />

      <ListActionBar>
        <NewButton
          tooltip="Novo Admin Global"
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
              title="Nenhum administrador global"
              description="Cadastre usuários com privilégios de super-admin."
              icon={Globe}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Admin Global"
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
            emptyTitle="Nenhum administrador global"
            emptyDescription="Cadastre usuários com privilégios de super-admin."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Admin Global"
            renderCard={(item) => (
              <GlobalUserCard
                item={item}
                onEdit={() => {
                  if (item.usuario === 'admin_global') {
                    toast({ description: 'O usuário root não pode ser editado aqui.' });
                    return;
                  }
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Detalhe do Admin Global"
            emptyDetailTitle="Nenhum admin selecionado"
            emptyDetailDescription="Clique em um admin global na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7 shrink-0 border border-kreato-cyan">
                  <AvatarImage src={item.foto || undefined} alt={item.nome} />
                  <AvatarFallback className="text-xs bg-kreato-cyan/10 text-kreato-cyan">
                    {item.nome.charAt(0)}
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
              <GlobalUserDetailPanel
                item={item}
                onEdit={() => {
                  if (item.usuario === 'admin_global') {
                    toast({ description: 'O usuário root não pode ser editado aqui.' });
                    return;
                  }
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
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
    </div>
  );
};

export default GlobalUsers;
