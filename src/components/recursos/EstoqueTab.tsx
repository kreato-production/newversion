import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EstoqueItem {
  id: string;
  numerador: number;
  codigo: string;
  nome: string;
  descricao: string;
}

interface EstoqueTabProps {
  recursoFisicoId?: string;
  itens: EstoqueItem[];
  onItensChange: (itens: EstoqueItem[]) => void;
}

export const EstoqueTab = ({ recursoFisicoId, itens, onItensChange }: EstoqueTabProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (recursoFisicoId) {
      fetchItens();
    }
  }, [recursoFisicoId]);

  const fetchItens = async () => {
    if (!recursoFisicoId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rf_estoque_itens')
        .select('*')
        .eq('recurso_fisico_id', recursoFisicoId)
        .order('numerador');

      if (error) throw error;

      const mappedItens: EstoqueItem[] = (data || []).map(item => ({
        id: item.id,
        numerador: item.numerador,
        codigo: item.codigo || '',
        nome: item.nome,
        descricao: item.descricao || '',
      }));

      onItensChange(mappedItens);
    } catch (error) {
      console.error('Error fetching estoque:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar itens de estoque', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getNextNumerador = () => {
    if (itens.length === 0) return 1;
    return Math.max(...itens.map(i => i.numerador)) + 1;
  };

  const handleAddItem = () => {
    const novoItem: EstoqueItem = {
      id: crypto.randomUUID(),
      numerador: getNextNumerador(),
      codigo: '',
      nome: '',
      descricao: '',
    };
    onItensChange([...itens, novoItem]);
  };

  const handleRemoveItem = (id: string) => {
    onItensChange(itens.filter(i => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof EstoqueItem, value: string | number) => {
    onItensChange(itens.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          Itens de Estoque
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
          <Plus className="w-4 h-4 mr-1" />
          Adicionar Item
        </Button>
      </div>

      {itens.length === 0 ? (
        <div className="text-center py-6 border rounded-lg border-dashed bg-muted/20">
          <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum item de estoque cadastrado.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Clique em "Adicionar Item" para incluir itens ao estoque.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {itens.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    {item.numerador}
                  </span>
                  Item #{item.numerador}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Código</Label>
                  <Input
                    value={item.codigo}
                    onChange={(e) => handleItemChange(item.id, 'codigo', e.target.value)}
                    placeholder="Código do item"
                    maxLength={50}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    value={item.nome}
                    onChange={(e) => handleItemChange(item.id, 'nome', e.target.value)}
                    placeholder="Nome do item"
                    maxLength={100}
                    required
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Descrição</Label>
                <Textarea
                  value={item.descricao}
                  onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)}
                  placeholder="Descrição detalhada do item"
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
