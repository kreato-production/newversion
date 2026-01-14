import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import type { RecursoTecnico } from '@/pages/recursos/RecursosTecnicos';

interface Cargo {
  id: string;
  nome: string;
}

interface RecursoTecnicoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecursoTecnico) => void;
  data?: RecursoTecnico | null;
}

export const RecursoTecnicoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: RecursoTecnicoFormModalProps) => {
  const { user } = useAuth();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [formData, setFormData] = useState({
    codigoExterno: data?.codigoExterno || '',
    nome: data?.nome || '',
    cargoOperador: data?.cargoOperador || '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('kreato_cargos');
    setCargos(stored ? JSON.parse(stored) : []);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        codigoExterno: data?.codigoExterno || '',
        nome: data?.nome || '',
        cargoOperador: data?.cargoOperador || '',
      });
    }
  }, [isOpen, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: data?.id || crypto.randomUUID(),
      codigoExterno: formData.codigoExterno,
      nome: formData.nome,
      cargoOperador: formData.cargoOperador,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    setFormData({ codigoExterno: '', nome: '', cargoOperador: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Recurso Técnico' : 'Novo Recurso Técnico'}</DialogTitle>
          <DialogDescription>
            Preencha os campos para {data ? 'editar' : 'cadastrar'} o recurso técnico.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cargoOperador">Cargo do Operador</Label>
            <Select
              value={formData.cargoOperador}
              onValueChange={(value) => setFormData({ ...formData, cargoOperador: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cargo..." />
              </SelectTrigger>
              <SelectContent>
                {cargos.map((cargo) => (
                  <SelectItem key={cargo.id} value={cargo.nome}>
                    {cargo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define qual cargo pode operar este recurso
            </p>
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
