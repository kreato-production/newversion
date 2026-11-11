import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import {
  FieldAsterisk,
  useFormFieldConfig,
  ConfigurableFieldGrid,
} from '@/hooks/useFormFieldConfig';
import { useToast } from '@/hooks/use-toast';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import { Building2, Trash2, Loader2 } from 'lucide-react';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';

export interface CentroLucro {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  status: 'Ativo' | 'Inativo';
  parentId: string | null;
  dataCadastro: string;
  usuarioCadastro: string;
}

interface UnidadeNegocio {
  id: string;
  nome: string;
}

const repository = new ApiParametrizacoesRepository();

/** Fields of the Centro de Custos cadastro (with its Unidades de Negócio), inside a `RecordFormPage`. */
export const CentroLucroFormBody = ({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<CentroLucro, CentroLucro>) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('centroLucro');
  const [formData, setFormData] = useState(() => ({
    codigoExterno: data?.codigoExterno || '',
    nome: data?.nome || '',
    descricao: data?.descricao || '',
    status: (data?.status || 'Ativo') as 'Ativo' | 'Inativo',
    parentId: data?.parentId || '',
  }));
  // All centros, to pick the parent (excluding this one and its descendants).
  const [centrosLucro, setCentrosLucro] = useState<CentroLucro[]>([]);

  useEffect(() => {
    repository
      .listCentrosLucro()
      .then((response) => setCentrosLucro(response.data as CentroLucro[]))
      .catch((err) => console.error('Error fetching centros lucro:', err));
  }, []);

  const [unidades, setUnidades] = useState<UnidadeNegocio[]>([]);
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [isLoadingUnidades, setIsLoadingUnidades] = useState(false);

  const fetchUnidades = useCallback(async () => {
    if (!data?.id) {
      setUnidades([]);
      setSelectedUnidades([]);
      return;
    }

    setIsLoadingUnidades(true);
    try {
      const response = await repository.listCentroLucroUnidades(data.id);
      setUnidades(response.unidades || []);
      setSelectedUnidades(response.selectedUnidades || []);
    } catch (err) {
      console.error('Error fetching unidades:', err);
    } finally {
      setIsLoadingUnidades(false);
    }
  }, [data?.id]);

  useEffect(() => {
    void fetchUnidades();
  }, [fetchUnidades]);

  const handleUnidadeToggle = (unidadeId: string) => {
    setSelectedUnidades((prev) =>
      prev.includes(unidadeId) ? prev.filter((id) => id !== unidadeId) : [...prev, unidadeId],
    );
  };

  const saveUnidadeAssociations = async (centroLucroId: string) => {
    try {
      await repository.saveCentroLucroUnidades(centroLucroId, selectedUnidades);
    } catch (err) {
      console.error('Error saving unidade associations:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const camposValidos = validate({
      codigoExterno: formData.codigoExterno,
      nome: formData.nome,
      parentId: formData.parentId,
      status: formData.status,
      descricao: formData.descricao,
    });
    if (!camposValidos) return;

    const centroLucroData: CentroLucro = {
      id: data?.id || crypto.randomUUID(),
      ...formData,
      parentId: formData.parentId || null,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    };

    // The page shows the success/error toasts.
    await onSubmit(centroLucroData);
  };

  const getDescendantIds = (parentId: string): string[] => {
    const children = centrosLucro.filter((centro) => centro.parentId === parentId);
    let descendants: string[] = children.map((child) => child.id);
    children.forEach((child) => {
      descendants = [...descendants, ...getDescendantIds(child.id)];
    });
    return descendants;
  };

  const availableParents = centrosLucro.filter((centro) => {
    if (!data) return true;
    if (centro.id === data.id) return false;
    const descendants = getDescendantIds(data.id);
    return !descendants.includes(centro.id);
  });

  return (
    <Tabs defaultValue="dados" className="w-full">
      <TabsList>
        <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
        <TabsTrigger value="unidades" disabled={!data}>
          Unidade de Negocio
        </TabsTrigger>
      </TabsList>

      {/* Kept mounted so the page Save button finds the form from any tab. */}
      <TabsContent value="dados" forceMount className="data-[state=inactive]:hidden">
        <form id={formId} onSubmit={(e) => void handleSubmit(e)} className="space-y-4 mt-4">
          <ConfigurableFieldGrid>
            <div className="space-y-1.5" {...fieldLayout('codigoExterno')}>
              <Label htmlFor="codigoExterno">
                {fieldLabel('codigoExterno', 'Codigo Externo')}{' '}
                <FieldAsterisk type={getAsterisk('codigoExterno')} />
              </Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                maxLength={20}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5" {...fieldLayout('status')}>
              <Label htmlFor="status">
                {fieldLabel('status', 'Status')} <FieldAsterisk type={getAsterisk('status')} />
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'Ativo' | 'Inativo') =>
                  setFormData({ ...formData, status: value })
                }
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5" {...fieldLayout('nome')}>
              <Label htmlFor="nome">
                {fieldLabel('nome', 'Nome')} <FieldAsterisk type={getAsterisk('nome', true)} />
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                maxLength={100}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5" {...fieldLayout('parentId')}>
              <Label htmlFor="parentId">
                {fieldLabel('parentId', 'Centro de Custos Pai')}{' '}
                <FieldAsterisk type={getAsterisk('parentId')} />
              </Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value === 'none' ? '' : value })
                }
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum (raiz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (raiz)</SelectItem>
                  {availableParents.map((centro) => (
                    <SelectItem key={centro.id} value={centro.id}>
                      {centro.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5" {...fieldLayout('descricao')}>
              <Label htmlFor="descricao">
                {fieldLabel('descricao', 'Descricao')}{' '}
                <FieldAsterisk type={getAsterisk('descricao')} />
              </Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
                disabled={readOnly}
              />
            </div>
          </ConfigurableFieldGrid>
        </form>
      </TabsContent>

      <TabsContent value="unidades" className="mt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Selecione as unidades de negocio associadas a este centro de custos:</span>
          </div>

          {isLoadingUnidades ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : unidades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma unidade de negocio cadastrada.
            </div>
          ) : (
            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {unidades.map((unidade) => (
                <div
                  key={unidade.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`unidade-${unidade.id}`}
                    checked={selectedUnidades.includes(unidade.id)}
                    onCheckedChange={() => handleUnidadeToggle(unidade.id)}
                    disabled={readOnly}
                  />
                  <label
                    htmlFor={`unidade-${unidade.id}`}
                    className="flex-1 cursor-pointer text-xs font-medium"
                  >
                    {unidade.nome}
                  </label>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span>{selectedUnidades.length} unidade(s) selecionada(s)</span>
            {selectedUnidades.length > 0 && !readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUnidades([])}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpar selecao
              </Button>
            )}
          </div>
          <div className="flex justify-end">
            {!readOnly && (
              <Button
                type="button"
                className="gradient-primary hover:opacity-90"
                onClick={async () => {
                  if (data?.id) {
                    try {
                      await saveUnidadeAssociations(data.id);
                      toast({
                        title: 'Sucesso',
                        description: 'Unidades de negocio atualizadas!',
                      });
                    } catch {
                      toast({
                        title: 'Erro',
                        description: 'Erro ao salvar as associacoes',
                        variant: 'destructive',
                      });
                    }
                  }
                }}
              >
                Salvar Unidades
              </Button>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
