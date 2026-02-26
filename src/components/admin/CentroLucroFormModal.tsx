import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Trash2, Loader2 } from 'lucide-react';

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

interface CentroLucroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CentroLucro) => void;
  data?: CentroLucro | null;
  centrosLucro: CentroLucro[];
  readOnly?: boolean;
}

interface UnidadeNegocio {
  id: string;
  nome: string;
}

export const CentroLucroFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  centrosLucro,
}: CentroLucroFormModalProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    descricao: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
    parentId: '',
  });

  const [unidades, setUnidades] = useState<UnidadeNegocio[]>([]);
  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [isLoadingUnidades, setIsLoadingUnidades] = useState(false);

  const fetchUnidades = useCallback(async () => {
    if (!session) return;
    
    setIsLoadingUnidades(true);
    try {
      // Buscar todas as unidades de negócio
      const { data: unidadesData, error: unidadesError } = await supabase
        .from('unidades_negocio')
        .select('id, nome')
        .order('nome');

      if (unidadesError) throw unidadesError;
      setUnidades(unidadesData || []);

      // Se estiver editando, buscar as unidades já associadas
      if (data?.id) {
        const { data: associacoes, error: assocError } = await supabase
          .from('centro_lucro_unidades')
          .select('unidade_negocio_id')
          .eq('centro_lucro_id', data.id);

        if (assocError) throw assocError;
        setSelectedUnidades((associacoes || []).map(a => a.unidade_negocio_id));
      } else {
        setSelectedUnidades([]);
      }
    } catch (err) {
      console.error('Error fetching unidades:', err);
    } finally {
      setIsLoadingUnidades(false);
    }
  }, [session, data?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchUnidades();
    }
  }, [isOpen, fetchUnidades]);

  useEffect(() => {
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno || '',
        nome: data.nome || '',
        descricao: data.descricao || '',
        status: data.status || 'Ativo',
        parentId: data.parentId || '',
      });
    } else {
      setFormData({
        codigoExterno: '',
        nome: '',
        descricao: '',
        status: 'Ativo',
        parentId: '',
      });
      setSelectedUnidades([]);
    }
  }, [data, isOpen]);

  const handleUnidadeToggle = (unidadeId: string) => {
    setSelectedUnidades(prev => 
      prev.includes(unidadeId)
        ? prev.filter(id => id !== unidadeId)
        : [...prev, unidadeId]
    );
  };

  const saveUnidadeAssociations = async (centroLucroId: string) => {
    try {
      // Remover associações existentes
      const { error: deleteError } = await supabase
        .from('centro_lucro_unidades')
        .delete()
        .eq('centro_lucro_id', centroLucroId);

      if (deleteError) throw deleteError;

      // Adicionar novas associações
      if (selectedUnidades.length > 0) {
        const newAssociations = selectedUnidades.map(unidadeId => ({
          centro_lucro_id: centroLucroId,
          unidade_negocio_id: unidadeId,
        }));

        const { error: insertError } = await supabase
          .from('centro_lucro_unidades')
          .insert(newAssociations);

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error saving unidade associations:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const centroLucroData: CentroLucro = {
      id: data?.id || crypto.randomUUID(),
      ...formData,
      parentId: formData.parentId || null,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    };

    try {
      // Salvar o centro de lucro primeiro
      onSave(centroLucroData);
      
      // Depois salvar as associações (se for edição)
      if (data?.id) {
        await saveUnidadeAssociations(data.id);
      }
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar as associações de unidades',
        variant: 'destructive',
      });
    }
    
    onClose();
  };

  // Filtrar centros de lucro que podem ser pai (não pode ser ele mesmo nem seus filhos)
  const getDescendantIds = (parentId: string): string[] => {
    const children = centrosLucro.filter((cl) => cl.parentId === parentId);
    let descendants: string[] = children.map((c) => c.id);
    children.forEach((child) => {
      descendants = [...descendants, ...getDescendantIds(child.id)];
    });
    return descendants;
  };

  const availableParents = centrosLucro.filter((cl) => {
    if (!data) return true;
    if (cl.id === data.id) return false;
    const descendants = getDescendantIds(data.id);
    return !descendants.includes(cl.id);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? 'Editar Centro de Custos' : 'Novo Centro de Custos'}
          </DialogTitle>
          <DialogDescription>
            Preencha os campos para {data ? 'editar' : 'cadastrar'} o centro de custos.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="unidades" disabled={!data}>Unidade de Negócio</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) =>
                      setFormData({ ...formData, codigoExterno: e.target.value })
                    }
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'Ativo' | 'Inativo') =>
                      setFormData({ ...formData, status: value })
                    }
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId">Centro de Custos Pai</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum (raiz)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (raiz)</SelectItem>
                    {availableParents.map((cl) => (
                      <SelectItem key={cl.id} value={cl.id}>
                        {cl.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary hover:opacity-90">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="unidades" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Selecione as unidades de negócio associadas a este centro de custos:</span>
              </div>

              {isLoadingUnidades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : unidades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma unidade de negócio cadastrada.
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
                      />
                      <label
                        htmlFor={`unidade-${unidade.id}`}
                        className="flex-1 cursor-pointer text-sm font-medium"
                      >
                        {unidade.nome}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                <span>{selectedUnidades.length} unidade(s) selecionada(s)</span>
                {selectedUnidades.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUnidades([])}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar seleção
                  </Button>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                <Button
                  type="button"
                  className="gradient-primary hover:opacity-90"
                  onClick={async () => {
                    if (data?.id) {
                      try {
                        await saveUnidadeAssociations(data.id);
                        toast({
                          title: 'Sucesso',
                          description: 'Unidades de negócio atualizadas!',
                        });
                      } catch {
                        toast({
                          title: 'Erro',
                          description: 'Erro ao salvar as associações',
                          variant: 'destructive',
                        });
                      }
                    }
                  }}
                >
                  Salvar Unidades
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
