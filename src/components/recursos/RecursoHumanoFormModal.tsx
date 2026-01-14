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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import type { RecursoHumano } from '@/pages/recursos/RecursosHumanos';

interface RecursoHumanoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecursoHumano) => void;
  data?: RecursoHumano | null;
}

export const RecursoHumanoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: RecursoHumanoFormModalProps) => {
  const { user } = useAuth();
  const [departamentos, setDepartamentos] = useState<{ id: string; nome: string }[]>([]);
  const [cargos, setCargos] = useState<{ id: string; nome: string }[]>([]);

  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    sobrenome: '',
    foto: '',
    dataNascimento: '',
    sexo: '',
    telefone: '',
    email: '',
    departamento: '',
    cargo: '',
    custoHora: 0,
    dataContratacao: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

  useEffect(() => {
    const storedDep = localStorage.getItem('kreato_departamentos');
    const storedCargos = localStorage.getItem('kreato_cargos');
    setDepartamentos(storedDep ? JSON.parse(storedDep) : []);
    setCargos(storedCargos ? JSON.parse(storedCargos) : []);
  }, [isOpen]);

  useEffect(() => {
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        sobrenome: data.sobrenome,
        foto: data.foto || '',
        dataNascimento: data.dataNascimento,
        sexo: data.sexo,
        telefone: data.telefone,
        email: data.email,
        departamento: data.departamento,
        cargo: data.cargo,
        custoHora: data.custoHora,
        dataContratacao: data.dataContratacao,
        status: data.status,
      });
    } else {
      setFormData({
        codigoExterno: '',
        nome: '',
        sobrenome: '',
        foto: '',
        dataNascimento: '',
        sexo: '',
        telefone: '',
        email: '',
        departamento: '',
        cargo: '',
        custoHora: 0,
        dataContratacao: '',
        status: 'Ativo',
      });
    }
  }, [data, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do colaborador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">Código Externo</Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                maxLength={10}
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
              <Label htmlFor="sobrenome">Sobrenome *</Label>
              <Input
                id="sobrenome"
                value={formData.sobrenome}
                onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select
                value={formData.sexo}
                onValueChange={(value) => setFormData({ ...formData, sexo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataContratacao">Data de Contratação</Label>
              <Input
                id="dataContratacao"
                type="date"
                value={formData.dataContratacao}
                onChange={(e) => setFormData({ ...formData, dataContratacao: e.target.value })}
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={formData.departamento}
                onValueChange={(value) => setFormData({ ...formData, departamento: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((d) => (
                    <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={formData.cargo}
                onValueChange={(value) => setFormData({ ...formData, cargo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'Ativo' | 'Inativo' })}
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
