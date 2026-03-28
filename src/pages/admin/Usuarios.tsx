import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  role?: 'GLOBAL_ADMIN' | 'TENANT_ADMIN' | 'USER';
}

const apiRepository = new ApiUsuariosRepository();

const Usuarios = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | null>(null);
  const [items, setItems] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const data = await apiRepository.list();
      setItems(
        data.map((item) => ({
          id: item.id,
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
          role: item.role,
        })),
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
        perfil: data.perfil || '',
        descricao: data.descricao || '',
        status: data.status || 'Ativo',
        tipoAcesso: data.tipoAcesso || 'Operacional',
        recursoHumanoId: data.recursoHumanoId || undefined,
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

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuario?')) {
      return;
    }

    try {
      await apiRepository.remove(id);
      toast({
        title: 'Sucesso',
        description: 'Usuario excluido!',
      });
      await fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir usuario',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.usuario.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()),
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

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
              void handleDelete(item.id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
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
      </ListActionBar>

      <DataCard>
        {filteredItems.length === 0 ? (
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
            storageKey="kreato_usuarios_table"
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

export default Usuarios;
