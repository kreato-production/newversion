import { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';

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
}

export const CentroLucroFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  centrosLucro,
}: CentroLucroFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    descricao: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
    parentId: '',
  });

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
    }
  }, [data, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      parentId: formData.parentId || null,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {data ? 'Editar Centro de Lucro' : 'Novo Centro de Lucro'}
          </DialogTitle>
          <DialogDescription>
            Preencha os campos para {data ? 'editar' : 'cadastrar'} o centro de lucro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="parentId">Centro de Lucro Pai</Label>
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
      </DialogContent>
    </Dialog>
  );
};
