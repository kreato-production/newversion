import { useState } from 'react';
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
import { Plus, Trash2, Package, Edit, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EstoqueItem } from '@/modules/recursos-fisicos/recursos-fisicos.types';

interface EstoqueTabProps {
  itens: EstoqueItem[];
  onItensChange: (itens: EstoqueItem[]) => void;
  readOnly?: boolean;
}

interface ItemFormData {
  codigo: string;
  nome: string;
  descricao: string;
  imagemUrl: string;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler imagem'));
    reader.readAsDataURL(file);
  });
}

export const EstoqueTab = ({ itens, onItensChange, readOnly = false }: EstoqueTabProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EstoqueItem | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    codigo: '',
    nome: '',
    descricao: '',
    imagemUrl: '',
  });

  const getNextNumerador = () => {
    if (itens.length === 0) return 1;
    return Math.max(...itens.map((item) => item.numerador)) + 1;
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

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo de imagem.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no maximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      setFormData({ ...formData, imagemUrl: imageDataUrl });
      toast({ title: 'Sucesso', description: 'Imagem carregada com sucesso!' });
    } catch (error) {
      console.error('Error loading image:', error);
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
        description: 'O nome do item e obrigatorio.',
        variant: 'destructive',
      });
      return;
    }

    if (editingItem) {
      onItensChange(
        itens.map((item) => {
          if (item.id !== editingItem.id) return item;
          return {
            ...item,
            codigo: formData.codigo,
            nome: formData.nome,
            descricao: formData.descricao,
            imagemUrl: formData.imagemUrl,
          };
        }),
      );
    } else {
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
    onItensChange(itens.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Package className="w-4 h-4" />
          Itens de Estoque
        </Label>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={handleOpenAddModal}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Item
          </Button>
        )}
      </div>

      {itens.length === 0 ? (
        <div className="text-center py-6 border rounded-lg border-dashed bg-muted/20">
          <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum item de estoque cadastrado.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 w-16">#</th>
                <th className="text-left px-3 py-2 w-32">Codigo</th>
                <th className="text-left px-3 py-2">Nome</th>
                <th className="text-right px-3 py-2 w-24">Acoes</th>
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
                  <td className="px-3 py-2 font-mono text-sm">{item.codigo || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {item.imagemUrl && (
                        <div className="relative group/img">
                          <img
                            src={item.imagemUrl}
                            alt={item.nome}
                            className="w-8 h-8 rounded object-cover cursor-pointer transition-transform duration-200 group-hover/img:scale-150 group-hover/img:z-10 group-hover/img:relative group-hover/img:shadow-xl"
                          />
                        </div>
                      )}
                      <span>{item.nome}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {!readOnly && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item de Estoque'}</DialogTitle>
            <DialogDescription>
              Preencha os campos para {editingItem ? 'editar' : 'adicionar'} o item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-codigo">Codigo</Label>
              <Input
                id="item-codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Codigo do item"
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
              <Label htmlFor="item-descricao">Descricao</Label>
              <Textarea
                id="item-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descricao detalhada do item"
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
                Formatos aceitos: JPG, PNG, GIF. Tamanho maximo: 5MB.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveItem}
              className="gradient-primary hover:opacity-90"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
