import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { type FormaPagamentoItem } from '@/views/financeiro/FormasPagamento';

interface FormaPagamentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormaPagamentoItem) => Promise<void>;
  data?: FormaPagamentoItem | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const PRESET_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#eab308',
  '#6b7280',
  '#000000',
];

export const FormaPagamentoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: FormaPagamentoFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    codigoExterno: '',
    titulo: '',
    descricao: '',
    cor: '#3b82f6',
    isPadrao: false,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno || '',
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        cor: data.cor || '#3b82f6',
        isPadrao: data.isPadrao || false,
      });
      return;
    }

    setFormData({
      codigoExterno: '',
      titulo: '',
      descricao: '',
      cor: '#3b82f6',
      isPadrao: false,
    });
  }, [data, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      dataCadastro: data?.dataCadastro || new Date().toISOString(),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} a forma de pagamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">Codigo Externo</Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, codigoExterno: event.target.value }))
                }
                maxLength={50}
                placeholder="Opcional"
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">
                Titulo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, titulo: event.target.value }))
                }
                required
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.cor === color
                        ? 'border-primary ring-2 ring-primary/50 scale-110'
                        : 'border-border hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((current) => ({ ...current, cor: color }))}
                    disabled={readOnly}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={formData.cor}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, cor: event.target.value }))
                  }
                  className="w-14 h-10 p-1 cursor-pointer"
                  disabled={readOnly}
                />
                <Input
                  type="text"
                  value={formData.cor}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, cor: event.target.value }))
                  }
                  placeholder="#000000"
                  className="w-28 font-mono text-sm"
                  disabled={readOnly}
                />
                <Badge style={{ backgroundColor: formData.cor }} className="text-white ml-auto">
                  {formData.titulo || 'Preview'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <Checkbox
              id="isPadrao"
              checked={formData.isPadrao}
              onCheckedChange={(checked) =>
                setFormData((current) => ({ ...current, isPadrao: Boolean(checked) }))
              }
              disabled={readOnly}
            />
            <div className="space-y-1">
              <Label htmlFor="isPadrao" className="cursor-pointer">
                Forma padrao
              </Label>
              <p className="text-xs text-muted-foreground">
                Define esta forma como a opcao padrao para novos registos financeiros.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descricao</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(event) =>
                setFormData((current) => ({ ...current, descricao: event.target.value }))
              }
              rows={3}
              placeholder="Descricao da forma de pagamento..."
              disabled={readOnly}
            />
          </div>

          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {readOnly ? 'Fechar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button type="submit" className="gradient-primary hover:opacity-90">
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

export default FormaPagamentoFormModal;
