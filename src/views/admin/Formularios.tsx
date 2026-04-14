import { useCallback, useEffect, useState } from 'react';
import { formsRegistry, type FormDefinition } from '@/data/formsRegistry';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SearchBar, PageHeader } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { ModalNavigation } from '@/components/shared/ModalNavigation';
import { Loader2, Settings2, Building2 } from 'lucide-react';
import type { FieldValidationType, FullFieldConfig } from '@/modules/admin/admin-config.api';
import { ApiAdminConfigRepository } from '@/modules/admin/admin-config.api';
import { ApiTenantsRepository, type TenantApiItem } from '@/modules/tenants/tenants.api.repository';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

const apiRepository = new ApiAdminConfigRepository();
const tenantsRepository = new ApiTenantsRepository();

const TAMANHO_OPTIONS: { value: string; label: string }[] = [
  { value: 'padrao', label: 'Padrão' },
  { value: '1', label: '1 coluna (25%)' },
  { value: '2', label: '2 colunas (50%)' },
  { value: '3', label: '3 colunas (75%)' },
  { value: '4', label: '4 colunas (100%)' },
];

interface FieldRow {
  campo: string;
  label: string;
  tipoValidacao: FieldValidationType;
  tamanho: string | null;
  posicao: number | null;
}

interface FormularioConfigModalProps {
  form: FormDefinition | null;
  allForms: FormDefinition[];
  tenantId: string | undefined;
  onClose: () => void;
}

const FormularioConfigModal = ({
  form,
  allForms,
  tenantId,
  onClose,
}: FormularioConfigModalProps) => {
  const [currentForm, setCurrentForm] = useState<FormDefinition | null>(form);
  const [fieldRows, setFieldRows] = useState<FieldRow[]>([]);
  const [originalRows, setOriginalRows] = useState<FieldRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadForm = useCallback(
    async (f: FormDefinition) => {
      setIsLoading(true);
      try {
        const configs = await apiRepository.getFormularioCamposFull(f.id, tenantId);
        const rows: FieldRow[] = f.campos.map((fieldDef) => {
          const saved = configs[fieldDef.campo] as FullFieldConfig | undefined;
          return {
            campo: fieldDef.campo,
            label: fieldDef.label,
            tipoValidacao: saved?.tipoValidacao ?? null,
            tamanho: saved?.tamanho ?? null,
            posicao: saved?.posicao ?? null,
          };
        });
        setFieldRows(rows);
        setOriginalRows(rows);
      } catch {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar configurações.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, tenantId],
  );

  useEffect(() => {
    if (form) {
      setCurrentForm(form);
      void loadForm(form);
    }
  }, [form, loadForm]);

  const handleSave = async () => {
    if (!currentForm) return;
    setIsSaving(true);
    try {
      await apiRepository.saveFormularioCamposFull(
        currentForm.id,
        fieldRows.map((r) => ({
          campo: r.campo,
          tipoValidacao: r.tipoValidacao,
          tamanho: r.tamanho,
          posicao: r.posicao,
        })),
        tenantId,
      );
      setOriginalRows([...fieldRows]);
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.' });
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateRow = (campo: string, patch: Partial<FieldRow>) => {
    setFieldRows((prev) => prev.map((r) => (r.campo === campo ? { ...r, ...patch } : r)));
  };

  const hasChanges = JSON.stringify(fieldRows) !== JSON.stringify(originalRows);

  const currentIndex = allForms.findIndex((f) => f.id === currentForm?.id);
  const navigateTo = async (f: FormDefinition) => {
    setCurrentForm(f);
    await loadForm(f);
  };

  const isOpen = form !== null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <DialogContent className="w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentForm?.nome}
            {currentForm && <Badge variant="outline">{currentForm.modulo}</Badge>}
          </DialogTitle>
          <DialogDescription>
            Configure a validação, tamanho e posição dos campos deste formulário.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campo</TableHead>
                <TableHead className="w-[180px]">Validação</TableHead>
                <TableHead className="w-[160px]">Tamanho</TableHead>
                <TableHead className="w-[100px]">Posição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fieldRows.map((row) => (
                <TableRow key={row.campo}>
                  <TableCell className="font-medium">
                    {row.label}
                    {row.tipoValidacao === 'obrigatorio' && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                    {row.tipoValidacao === 'sugerido' && (
                      <span className="text-blue-500 ml-1">*</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.tipoValidacao ?? 'none'}
                      onValueChange={(value) =>
                        updateRow(row.campo, {
                          tipoValidacao: value === 'none' ? null : (value as FieldValidationType),
                        })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        <SelectItem value="obrigatorio">Obrigatório</SelectItem>
                        <SelectItem value="sugerido">Sugerido</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={row.tamanho ?? 'padrao'}
                      onValueChange={(value) =>
                        updateRow(row.campo, { tamanho: value === 'padrao' ? null : value })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAMANHO_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      className="h-8 w-20"
                      value={row.posicao ?? ''}
                      placeholder="—"
                      onChange={(e) =>
                        updateRow(row.campo, {
                          posicao: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="text-xs text-muted-foreground flex gap-6 pt-1">
          <span>
            <span className="text-destructive font-bold">*</span> Obrigatório — impede a gravação
          </span>
          <span>
            <span className="text-blue-500 font-bold">*</span> Sugerido — indica preenchimento
            recomendado
          </span>
        </div>

        <DialogFooter className="sm:justify-between">
          <ModalNavigation
            currentIndex={currentIndex}
            total={allForms.length}
            onPrevious={() => {
              if (currentIndex > 0) void navigateTo(allForms[currentIndex - 1]);
            }}
            onNext={() => {
              if (currentIndex < allForms.length - 1) void navigateTo(allForms[currentIndex + 1]);
            }}
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving || isLoading}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Formularios = () => {
  const { user } = useAuth();
  const isGlobalAdmin = user?.role === 'GLOBAL_ADMIN';

  const [configuringForm, setConfiguringForm] = useState<FormDefinition | null>(null);
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState<TenantApiItem[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const { enabledModules } = usePermissions();

  // Load tenants list for GLOBAL_ADMIN
  useEffect(() => {
    if (!isGlobalAdmin) return;
    setIsLoadingTenants(true);
    tenantsRepository
      .list()
      .then((list) => {
        setTenants(list.filter((t) => t.status === 'Ativo'));
      })
      .catch(console.error)
      .finally(() => setIsLoadingTenants(false));
  }, [isGlobalAdmin]);

  // The effective tenantId to use in API calls
  const effectiveTenantId = isGlobalAdmin ? selectedTenantId || undefined : undefined;

  const allForms = formsRegistry.filter(
    (f) => enabledModules.has(f.modulo) || enabledModules.has('Global'),
  );

  const filteredForms = allForms.filter(
    (f) =>
      !search ||
      f.nome.toLowerCase().includes(search.toLowerCase()) ||
      f.modulo.toLowerCase().includes(search.toLowerCase()),
  );

  const displayForms = filteredForms.length > 0 ? filteredForms : allForms;

  // GLOBAL_ADMIN must select a tenant before configuring
  const canConfigure = !isGlobalAdmin || !!selectedTenantId;

  return (
    <div className="p-6 space-y-4">
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
              onValueChange={setSelectedTenantId}
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Formulário</TableHead>
              <TableHead>Módulo</TableHead>
              <TableHead className="w-[80px] text-center">Campos</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredForms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                  Nenhum formulário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredForms.map((form) => (
                <TableRow
                  key={form.id}
                  className={canConfigure ? 'cursor-pointer' : 'opacity-50'}
                  onClick={() => canConfigure && setConfiguringForm(form)}
                >
                  <TableCell className="font-medium">{form.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{form.modulo}</Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {form.campos.length}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canConfigure}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canConfigure) setConfiguringForm(form);
                      }}
                    >
                      <Settings2 className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <FormularioConfigModal
        form={configuringForm}
        allForms={displayForms}
        tenantId={effectiveTenantId}
        onClose={() => setConfiguringForm(null)}
      />
    </div>
  );
};

export default Formularios;
