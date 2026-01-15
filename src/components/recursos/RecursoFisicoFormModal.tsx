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
import { useAuth } from '@/contexts/AuthContext';
import type { RecursoFisico } from '@/pages/recursos/RecursosFisicos';

interface RecursoFisicoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecursoFisico) => void;
  data?: RecursoFisico | null;
}

export const RecursoFisicoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: RecursoFisicoFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    custoHora: 0,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        custoHora: data.custoHora,
      });
    } else {
      setFormData({ codigoExterno: '', nome: '', custoHora: 0 });
    }
  }, [data, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: data?.id || crypto.randomUUID(),
      codigoExterno: formData.codigoExterno,
      nome: formData.nome,
      custoHora: formData.custoHora,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Recurso Físico' : 'Novo Recurso Físico'}</DialogTitle>
          <DialogDescription>
            Preencha os campos para {data ? 'editar' : 'cadastrar'} o recurso físico.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">Código Externo</Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                maxLength={10}
                placeholder="Máx. 10 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custoHora">Custo/Hora (R$)</Label>
              <Input
                id="custoHora"
                type="number"
                step="0.01"
                min="0"
                value={formData.custoHora}
                onChange={(e) => setFormData({ ...formData, custoHora: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              maxLength={100}
              required
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
