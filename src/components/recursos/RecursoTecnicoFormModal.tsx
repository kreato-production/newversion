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
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { recursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.repository.provider';
import type {
  RecursoTecnico,
  RecursoTecnicoInput,
} from '@/modules/recursos-tecnicos/recursos-tecnicos.types';

interface Funcao {
  id: string;
  nome: string;
}

interface RecursoTecnicoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecursoTecnicoInput) => Promise<void>;
  data?: RecursoTecnico | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

export const RecursoTecnicoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: RecursoTecnicoFormModalProps) => {
  const { getAsterisk } = useFormFieldConfig('recursoTecnico');
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [isLoadingFuncoes, setIsLoadingFuncoes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    codigoExterno: data?.codigoExterno || '',
    nome: data?.nome || '',
    funcaoOperador: data?.funcaoOperador || '',
    funcaoOperadorId: data?.funcaoOperadorId || '',
  });

  const fetchFuncoes = useCallback(async () => {
    setIsLoadingFuncoes(true);
    try {
      const response = await recursosTecnicosRepository.listOptions();
      setFuncoes(response.funcoes || []);
    } finally {
      setIsLoadingFuncoes(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchFuncoes().catch((error) => {
        console.error('Error fetching funcoes do recurso tecnico:', error);
        setFuncoes([]);
      });
    }
  }, [isOpen, fetchFuncoes]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        codigoExterno: data?.codigoExterno || '',
        nome: data?.nome || '',
        funcaoOperador: data?.funcaoOperador || '',
        funcaoOperadorId: data?.funcaoOperadorId || '',
      });
    }
  }, [isOpen, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await onSave({
        id: data?.id,
        codigoExterno: formData.codigoExterno,
        nome: formData.nome,
        funcaoOperador: formData.funcaoOperador,
        funcaoOperadorId: formData.funcaoOperadorId || undefined,
      });
      setFormData({ codigoExterno: '', nome: '', funcaoOperador: '', funcaoOperadorId: '' });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Recurso Tecnico' : 'Novo Recurso Tecnico'}</DialogTitle>
          <DialogDescription>
            Preencha os campos para {data ? 'editar' : 'cadastrar'} o recurso tecnico.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigoExterno">
              Codigo Externo <FieldAsterisk type={getAsterisk('codigoExterno')} />
            </Label>
            <Input
              id="codigoExterno"
              value={formData.codigoExterno}
              onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
              maxLength={10}
              placeholder="Max. 10 caracteres"
              disabled={readOnly || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome <FieldAsterisk type={getAsterisk('nome')} />
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              maxLength={100}
              required
              disabled={readOnly || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="funcaoOperador">
              Funcao do Operador <FieldAsterisk type={getAsterisk('funcaoOperador')} />
            </Label>
            <SearchableSelect
              options={funcoes.map((item) => ({ value: item.id, label: item.nome }))}
              value={formData.funcaoOperadorId}
              onValueChange={(value) => {
                const funcaoSelecionada = funcoes.find((item) => item.id === value);
                setFormData({
                  ...formData,
                  funcaoOperadorId: value,
                  funcaoOperador: funcaoSelecionada?.nome || '',
                });
              }}
              placeholder="Selecione a funcao..."
              searchPlaceholder="Pesquisar funcao..."
              disabled={readOnly || isSubmitting || isLoadingFuncoes}
            />
            <p className="text-xs text-muted-foreground">
              Define qual funcao pode operar este recurso
            </p>
          </div>
          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {readOnly ? 'Fechar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  className="gradient-primary hover:opacity-90"
                  disabled={isSubmitting}
                >
                  Salvar
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
