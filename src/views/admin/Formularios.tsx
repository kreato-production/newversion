import { useEffect, useState } from 'react';
import { formsRegistry, type FormDefinition } from '@/data/formsRegistry';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SearchBar, PageHeader, DataCard } from '@/components/shared/PageComponents';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Settings2, Building2 } from 'lucide-react';
import { ApiTenantsRepository, type TenantApiItem } from '@/modules/tenants/tenants.api.repository';
import {
  FORMULARIOS_ROUTES,
  readFormulariosTenant,
  saveFormulariosTenant,
} from '@/modules/admin/formularios.navigation';
import { useRecordList } from '@/hooks/useRecordNavigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

const tenantsRepository = new ApiTenantsRepository();

const Formularios = () => {
  const { user } = useAuth();
  const isGlobalAdmin = user?.role === 'GLOBAL_ADMIN';
  const { openRecord } = useRecordList(FORMULARIOS_ROUTES);

  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState<TenantApiItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const { enabledModules } = usePermissions();

  // GLOBAL_ADMIN: tenants ativos, mantendo o tenant escolhido antes de abrir um formulário.
  useEffect(() => {
    if (!isGlobalAdmin) return;
    setSelectedTenantId(readFormulariosTenant()?.id ?? '');
    setIsLoadingTenants(true);
    tenantsRepository
      .list()
      .then((list) => {
        setTenants(list.filter((t) => t.status === 'Ativo'));
      })
      .catch(console.error)
      .finally(() => setIsLoadingTenants(false));
  }, [isGlobalAdmin]);

  const handleTenantChange = (tenantId: string) => {
    if (!tenantId) return;
    setSelectedTenantId(tenantId);
    const tenant = tenants.find((t) => t.id === tenantId);
    saveFormulariosTenant(tenant ? { id: tenant.id, nome: tenant.nome } : null);
  };

  const allForms = formsRegistry.filter(
    (f) => enabledModules.has(f.modulo) || enabledModules.has('Global'),
  );

  const filteredForms = allForms.filter(
    (f) =>
      !search ||
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.modulo.toLowerCase().includes(search.toLowerCase()),
  );

  // GLOBAL_ADMIN must select a tenant before configuring
  const canConfigure = !isGlobalAdmin || !!selectedTenantId;

  const openForm = (item: FormDefinition) => {
    if (!canConfigure) return;
    openRecord(
      item.id,
      filteredForms.map((f) => f.id),
    );
  };

  const columns: Column<FormDefinition>[] = [
    {
      key: 'nome',
      label: 'Formulário',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'modulo',
      label: 'Módulo',
      groupable: true,
      render: (item) => <Badge variant="outline">{item.modulo}</Badge>,
    },
    {
      key: 'campos',
      label: 'Campos',
      className: 'w-20 text-center',
      sortable: false,
      render: (item) => <span className="text-muted-foreground">{item.campos.length}</span>,
    },
    {
      key: 'acoes',
      label: '',
      className: 'w-32',
      sortable: false,
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={!canConfigure}
          onClick={(e) => {
            e.stopPropagation();
            openForm(item);
          }}
        >
          <Settings2 className="h-4 w-4 mr-1" />
          Configurar
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Formulários"
        description="Configure validação e layout dos campos do sistema"
      />
      <ListActionBar>
        {isGlobalAdmin && (
          <div className="flex items-center gap-2 mr-auto">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label className="text-sm text-muted-foreground shrink-0">Tenant:</Label>
            <Select
              value={selectedTenantId}
              onValueChange={handleTenantChange}
              disabled={isLoadingTenants}
            >
              <SelectTrigger className="h-8 w-64">
                <SelectValue placeholder="Selecione um tenant..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar formulário..." />
      </ListActionBar>

      {isGlobalAdmin && !selectedTenantId ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Building2 className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            Selecione um tenant para visualizar e configurar os formulários.
          </p>
        </div>
      ) : (
        <DataCard>
          {filteredForms.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 text-sm">
              Nenhum formulário encontrado.
            </div>
          ) : (
            <SortableTable
              data={filteredForms}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey="kreato_formularios_table"
            />
          )}
        </DataCard>
      )}
    </>
  );
};

export default Formularios;
