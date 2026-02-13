import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, UserCog, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UsuarioFormModal } from '@/components/admin/UsuarioFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
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
  status: 'Ativo' | 'Inativo';
  tipoAcesso: string;
  recursoHumanoId?: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*, perfis_acesso:perfil_id(id, nome)')
        .order('nome');

      if (error) throw error;

      setItems((data || []).map((item: any) => ({
        id: item.id,
        codigoExterno: item.codigo_externo || '',
        nome: item.nome,
        email: item.email,
        usuario: item.usuario,
        senha: '', // Never store/display passwords
        foto: item.foto_url,
        perfil: item.perfis_acesso?.nome || '',
        perfilId: item.perfil_id,
        descricao: item.descricao || '',
        status: item.status || 'Ativo',
        tipoAcesso: item.tipo_acesso || 'Operacional',
        recursoHumanoId: item.recurso_humano_id || undefined,
        dataCadastro: item.created_at,
        usuarioCadastro: '',
      })));
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data: Usuario) => {
    try {
      const updateData = {
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        descricao: data.descricao || null,
        foto_url: data.foto || null,
        perfil_id: data.perfilId || null,
        status: data.status || 'Ativo',
        tipo_acesso: data.tipoAcesso || 'Operacional',
        recurso_humano_id: (data.recursoHumanoId && data.recursoHumanoId !== 'none') ? data.recursoHumanoId : null,
      };

      if (editingItem) {
        // Update profile data
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', data.id);

        if (error) throw error;

        // If password was changed, update auth via edge function
        if (data.senha && data.senha.length > 0) {
          const { data: result, error: pwError } = await supabase.functions.invoke('admin-create-user', {
            body: {
              updateOnly: true,
              userId: data.id,
              senha: data.senha,
            },
          });
          if (pwError) throw pwError;
          if (!result?.success) throw new Error(result?.error || 'Erro ao atualizar senha');
        }

        toast({ title: 'Sucesso', description: 'Usuário atualizado!' });
        await fetchData();
        setEditingItem(null);
        setIsModalOpen(false);
      } else {
        // Validate required fields
        if (!data.email || !data.senha || !data.nome || !data.usuario) {
          toast({
            title: 'Erro',
            description: 'Preencha todos os campos obrigatórios',
            variant: 'destructive',
          });
          return;
        }

        // Validate password length
        if (data.senha.length < 6) {
          toast({
            title: 'Erro',
            description: 'A senha deve ter pelo menos 6 caracteres',
            variant: 'destructive',
          });
          return;
        }

        // Criar usuário via função de backend (cria Auth + profiles)
        const { data: result, error: invokeError } = await supabase.functions.invoke('admin-create-user', {
          body: {
            codigoExterno: data.codigoExterno || null,
            nome: data.nome,
            email: data.email,
            usuario: data.usuario,
            senha: data.senha,
            foto: data.foto || null,
            perfilId: data.perfilId || null,
            descricao: data.descricao || null,
            status: data.status || 'Ativo',
            tipoAcesso: data.tipoAcesso || 'Operacional',
            recursoHumanoId: (data.recursoHumanoId && data.recursoHumanoId !== 'none') ? data.recursoHumanoId : null,
          },
        });

        if (invokeError) throw invokeError;

        if (!result?.success) {
          throw new Error(result?.error || 'Erro ao criar usuário');
        }

        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso!',
        });

        // Refresh the user list
        await fetchData();

        setEditingItem(null);
        setIsModalOpen(false);
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao salvar usuário',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este usuário?')) {
      try {
        // Note: Deleting users from profiles may have cascade effects
        // Usually users are deactivated, not deleted
        toast({ 
          title: 'Informação', 
          description: 'Usuários não podem ser excluídos diretamente. Considere desativá-los.' 
        });
      } catch (err) {
        console.error('Error deleting user:', err);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir usuário',
          variant: 'destructive',
        });
      }
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.usuario.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
      label: 'Código',
      className: 'w-24',
      render: (item) => (
        <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>
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
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
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
            onClick={(e) => {
              e.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
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
        title="Usuários"
        description="Gerencie os usuários do sistema"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Novo Usuário"
      />

      <ListActionBar>
        <SearchBar value={search} onChange={setSearch} />
      </ListActionBar>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum usuário cadastrado"
            description="Adicione usuários para gerenciar o acesso ao sistema."
            icon={UserCog}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Usuário"
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
