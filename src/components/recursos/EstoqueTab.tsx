import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2, Package, Edit, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EstoqueItem {
  id: string;
  numerador: number;
  codigo: string;
  nome: string;
  descricao: string;
  imagemUrl?: string;
}

interface EstoqueTabProps {
  recursoFisicoId?: string;
  itens: EstoqueItem[];
  onItensChange: (itens: EstoqueItem[]) => void;
}

interface ItemFormData {
  codigo: string;
  nome: string;
  descricao: string;
  imagemUrl: string;
}

export const EstoqueTab = ({ recursoFisicoId, itens, onItensChange }: EstoqueTabProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EstoqueItem | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    codigo: '',
    nome: '',
    descricao: '',
    imagemUrl: '',
  });

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
        imagemUrl: item.imagem_url || '',
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

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({ codigo: '', nome: '', descricao: '', imagemUrl: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: EstoqueItem) => {
    setEditingItem(item);
    setFormData({
      codigo: item.codigo,
      nome: item.nome,
      descricao: item.descricao,
      imagemUrl: item.imagemUrl || '',
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo de imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('estoque-itens')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('estoque-itens')
        .getPublicUrl(filePath);

      setFormData({ ...formData, imagemUrl: publicUrl.publicUrl });
      toast({ title: 'Sucesso', description: 'Imagem carregada com sucesso!' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar imagem. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imagemUrl: '' });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ codigo: '', nome: '', descricao: '', imagemUrl: '' });
  };

  const handleSaveItem = () => {
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do item é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (editingItem) {
      // Editar item existente
      onItensChange(itens.map(item => {
        if (item.id !== editingItem.id) return item;
        return {
          ...item,
          codigo: formData.codigo,
          nome: formData.nome,
          descricao: formData.descricao,
          imagemUrl: formData.imagemUrl,
        };
      }));
    } else {
      // Adicionar novo item
      const novoItem: EstoqueItem = {
        id: crypto.randomUUID(),
        numerador: getNextNumerador(),
        codigo: formData.codigo,
        nome: formData.nome,
        descricao: formData.descricao,
        imagemUrl: formData.imagemUrl,
      };
      onItensChange([...itens, novoItem]);
    }

    handleCloseModal();
  };

  const handleRemoveItem = (id: string) => {
    onItensChange(itens.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          Itens de Estoque
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={handleOpenAddModal}>
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
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 w-16">#</th>
                <th className="text-left px-3 py-2 w-32">Código</th>
                <th className="text-left px-3 py-2">Nome</th>
                <th className="text-right px-3 py-2 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => (
                <tr key={item.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {item.numerador}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-sm">
                    {item.codigo || '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {item.imagemUrl && (
                        <img 
                          src={item.imagemUrl} 
                          alt={item.nome}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span>{item.nome}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Adicionar/Editar Item */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Novo Item de Estoque'}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos para {editingItem ? 'editar' : 'adicionar'} o item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-codigo">Código</Label>
              <Input
                id="item-codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Código do item"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-nome">Nome *</Label>
              <Input
                id="item-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do item"
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-descricao">Descrição</Label>
              <Textarea
                id="item-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição detalhada do item"
                rows={3}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Imagem</Label>
              {formData.imagemUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={formData.imagemUrl} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Carregando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Selecionar imagem</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveItem} className="gradient-primary hover:opacity-90">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
