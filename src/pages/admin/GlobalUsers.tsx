import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const apiRepository = new ApiUsuariosRepository();

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

const GlobalUsers = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | null>(null);
  const [items, setItems] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
      </ListActionBar>

      <DataCard>
        {filteredItems.length === 0 ? (
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
            storageKey="kreato_global_users_table"
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
      />
    </div>
  );
};

export default GlobalUsers;
