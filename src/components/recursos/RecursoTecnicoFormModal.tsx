import { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import type { RecursoTecnico } from '@/pages/recursos/RecursosTecnicos';

interface Funcao {
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
  const { user, session } = useAuth();
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [formData, setFormData] = useState({
    codigoExterno: data?.codigoExterno || '',
    nome: data?.nome || '',
    funcaoOperador: data?.funcaoOperador || '',
  });

  const fetchFuncoes = useCallback(async () => {
    if (!session) return;

    const { data: funcoesData } = await supabase
      .from('funcoes')
      .select('id, nome')
      .order('nome');

    setFuncoes(funcoesData || []);
  }, [session]);

  useEffect(() => {
    if (isOpen) {
      fetchFuncoes();
    }
  }, [isOpen, fetchFuncoes]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        codigoExterno: data?.codigoExterno || '',
        nome: data?.nome || '',
        funcaoOperador: data?.funcaoOperador || '',
      });
    }
  }, [isOpen, data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: data?.id || crypto.randomUUID(),
      codigoExterno: formData.codigoExterno,
      nome: formData.nome,
      funcaoOperador: formData.funcaoOperador,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    setFormData({ codigoExterno: '', nome: '', funcaoOperador: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
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
            <Label htmlFor="funcaoOperador">Função do Operador</Label>
            <Select
              value={formData.funcaoOperador}
              onValueChange={(value) => setFormData({ ...formData, funcaoOperador: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função..." />
              </SelectTrigger>
              <SelectContent>
                {funcoes.map((funcao) => (
                  <SelectItem key={funcao.id} value={funcao.nome}>
                    {funcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define qual função pode operar este recurso
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
