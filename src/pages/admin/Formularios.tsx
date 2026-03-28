import { useCallback, useState } from 'react';
import { formsRegistry, type FormDefinition } from '@/data/formsRegistry';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ChevronLeft, FileText, Save } from 'lucide-react';
import type { FieldValidationType } from '@/hooks/useFormFieldConfig';
import { usePermissions } from '@/hooks/usePermissions';
import { ApiAdminConfigRepository } from '@/modules/admin/admin-config.api';

const apiRepository = new ApiAdminConfigRepository();

const Formularios = () => {
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldValidationType>>({});
  const [originalConfigs, setOriginalConfigs] = useState<Record<string, FieldValidationType>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { enabledModules } = usePermissions();

  const fetchFieldConfigs = useCallback(
    async (formularioId: string) => {
      setIsLoading(true);
      try {
        const configs = await apiRepository.getFormularioCampos(formularioId);
        setFieldConfigs(configs);
        setOriginalConfigs(configs);
      } catch (error) {
        console.error('Error fetching configs:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar configurações do formulário.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  const handleSelectForm = (form: FormDefinition) => {
    setSelectedForm(form);
    void fetchFieldConfigs(form.id);
  };

  const handleFieldValidationChange = (campo: string, value: string) => {
    const tipo: FieldValidationType = value === 'none' ? null : (value as FieldValidationType);
    setFieldConfigs((current) => ({ ...current, [campo]: tipo }));
  };

  const handleSave = async () => {
    if (!selectedForm) {
      return;
    }

    setIsSaving(true);
    try {
      await apiRepository.saveFormularioCampos(selectedForm.id, fieldConfigs);
      setOriginalConfigs({ ...fieldConfigs });
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.' });
    } catch (error) {
      console.error('Error saving configs:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(fieldConfigs) !== JSON.stringify(originalConfigs);

  const groupedForms = formsRegistry.reduce(
    (acc, form) => {
      if (enabledModules.has(form.modulo) || enabledModules.has('Global')) {
        if (!acc[form.modulo]) {
          acc[form.modulo] = [];
        }
        acc[form.modulo].push(form);
      }
      return acc;
    },
    {} as Record<string, FormDefinition[]>,
  );

  if (selectedForm) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedForm(null)}>
            <ChevronLeft size={16} className="mr-1" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold">{selectedForm.nome}</h1>
          <Badge variant="outline">{selectedForm.modulo}</Badge>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Campos do Formulário</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead className="w-[200px]">Validação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedForm.campos.map((field) => {
                      const currentValue = fieldConfigs[field.campo] || 'none';

                      return (
                        <TableRow key={field.campo}>
                          <TableCell className="font-medium">
                            {field.label}
                            {fieldConfigs[field.campo] === 'obrigatorio' ? (
                              <span className="text-destructive ml-1">*</span>
                            ) : null}
                            {fieldConfigs[field.campo] === 'sugerido' ? (
                              <span className="text-blue-500 ml-1">*</span>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={currentValue}
                              onValueChange={(value) =>
                                handleFieldValidationChange(field.campo, value)
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
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="flex justify-end mt-4">
                  <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-6 text-xs text-muted-foreground">
              <span>
                <span className="text-destructive font-bold">*</span> Obrigatório - impede a
                gravação do registro
              </span>
              <span>
                <span className="text-blue-500 font-bold">*</span> Sugerido - indica preenchimento
                recomendado
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Formulários</h1>

      {Object.entries(groupedForms).map(([modulo, forms]) => (
        <Card key={modulo}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{modulo}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formulário</TableHead>
                  <TableHead className="w-[100px] text-center">Campos</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow
                    key={form.id}
                    className="cursor-pointer"
                    onClick={() => handleSelectForm(form)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" />
                        {form.nome}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{form.campos.length}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Configurar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Formularios;
