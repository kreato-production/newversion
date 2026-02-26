// ============= Full file contents =============

import { useState, useEffect, useCallback } from 'react';
import { formsRegistry, type FormDefinition } from '@/data/formsRegistry';
import { supabase } from '@/integrations/supabase/client';
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

const Formularios = () => {
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldValidationType>>({});
  const [originalConfigs, setOriginalConfigs] = useState<Record<string, FieldValidationType>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { enabledModules } = usePermissions();

  const fetchFieldConfigs = useCallback(async (formularioId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('formulario_campos')
        .select('campo, tipo_validacao')
        .eq('formulario', formularioId);

      if (error) throw error;

      const configs: Record<string, FieldValidationType> = {};
      (data || []).forEach((item: any) => {
        configs[item.campo] = item.tipo_validacao;
      });
      setFieldConfigs(configs);
      setOriginalConfigs(configs);
    } catch (err) {
      console.error('Error fetching configs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectForm = (form: FormDefinition) => {
    setSelectedForm(form);
    fetchFieldConfigs(form.id);
  };

  const handleFieldValidationChange = (campo: string, value: string) => {
    const tipo: FieldValidationType = value === 'none' ? null : (value as FieldValidationType);
    setFieldConfigs(prev => ({ ...prev, [campo]: tipo }));
  };

  const handleSave = async () => {
    if (!selectedForm) return;
    setIsSaving(true);

    try {
      // For each field, upsert or delete the config
      for (const field of selectedForm.campos) {
        const tipo = fieldConfigs[field.campo];
        const hadValue = originalConfigs[field.campo];

        if (tipo) {
          // Upsert
          const { error } = await (supabase as any)
            .from('formulario_campos')
            .upsert(
              { formulario: selectedForm.id, campo: field.campo, tipo_validacao: tipo },
              { onConflict: 'formulario,campo' }
            );
          if (error) throw error;
        } else if (hadValue) {
          // Delete if was set before
          const { error } = await (supabase as any)
            .from('formulario_campos')
            .delete()
            .eq('formulario', selectedForm.id)
            .eq('campo', field.campo);
          if (error) throw error;
        }
      }

      setOriginalConfigs({ ...fieldConfigs });
      toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso.' });
    } catch (err) {
      console.error('Error saving configs:', err);
      toast({ title: 'Erro', description: 'Erro ao salvar configurações.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(fieldConfigs) !== JSON.stringify(originalConfigs);

  // Group forms by module
  const groupedForms = formsRegistry.reduce((acc, form) => {
    // Only include if module is enabled
    if (enabledModules.has(form.modulo) || enabledModules.has('Global')) {
      if (!acc[form.modulo]) acc[form.modulo] = [];
      acc[form.modulo].push(form);
    }
    return acc;
  }, {} as Record<string, FormDefinition[]>);

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
                            {fieldConfigs[field.campo] === 'obrigatorio' && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                            {fieldConfigs[field.campo] === 'sugerido' && (
                              <span className="text-blue-500 ml-1">*</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={currentValue}
                              onValueChange={(v) => handleFieldValidationChange(field.campo, v)}
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
              <span><span className="text-destructive font-bold">*</span> Obrigatório — impede a gravação do registro</span>
              <span><span className="text-blue-500 font-bold">*</span> Sugerido — indica preenchimento recomendado</span>
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
