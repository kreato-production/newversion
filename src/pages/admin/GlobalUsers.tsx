import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Globe, Loader2, Key } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Usuario } from './Usuarios';
import { UsuarioFormModal } from '@/components/admin/UsuarioFormModal';

const GlobalUsers = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | null>(null);
  const [items, setItems] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch users who are global admins (via role 'global_admin')
      // Note: We need a way to filter profiles that are global admins.
      // Since 'role' is in user_roles table, we first get global admins from there
      
      const { data: globalRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'global_admin');

      if (rolesError) throw rolesError;

      const globalIds = globalRoles.map(r => r.user_id);

      if (globalIds.length === 0) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', globalIds)
        .order('nome');

      if (error) throw error;

      setItems((data || []).map((item: any) => ({
        id: item.id,
        codigoExterno: item.codigo_externo || '',
        nome: item.nome,
        email: item.email,
        usuario: item.usuario,
        senha: '',
        foto: item.foto_url,
        perfil: 'Admin Global',
        perfilId: item.perfil_id,
        descricao: item.descricao || '',
        status: item.status || 'Ativo',
        tipoAcesso: 'Global',
        recursoHumanoId: undefined,
        dataCadastro: item.created_at,
        usuarioCadastro: '',
      })));
    } catch (err) {
      console.error('Error fetching global users:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários globais',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Using same form modal as regular users but with special handling
  // We'll need to adapt the save logic slightly
  const handleSave = async (data: Usuario) => {
    // Note: The admin-create-user function needs to be updated to support 'role' parameter
    // For now, we will assume manual role assignment or update function later
    
    // TEMPORARY: Just show toast, as we need backend support for creating global admins properly
    toast({
      title: 'Em breve',
      description: 'A criação de usuários globais via interface será implementada na próxima etapa.',
    });
    setIsModalOpen(false);
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.usuario.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase())
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
              // Prevent editing admin_global for safety in this demo phase
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
        <NewButton tooltip="Novo Admin Global" onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />
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

      {/* Reusing form modal - will need adaptations for global context later */}
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
