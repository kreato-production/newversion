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
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';
import { type CategoriaDespesaItem } from '@/views/financeiro/CategoriasDespesa';

interface CategoriaDespesaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoriaDespesaItem) => Promise<void>;
  data?: CategoriaDespesaItem | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

export const CategoriaDespesaFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: CategoriaDespesaFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    codigoExterno: '',
    titulo: '',
    descricao: '',
    cor: '#3b82f6',
  });
  const [traducoes, setTraducoes] = useState<Traducoes>({});

  useEffect(() => {
    if (!isOpen) return;

    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno || '',
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        cor: data.cor || '#3b82f6',
      });
      setTraducoes((data.traducoes as Traducoes) ?? {});
      return;
    }

    setFormData({ codigoExterno: '', titulo: '', descricao: '', cor: '#3b82f6' });
    setTraducoes({});
  }, [data, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      traducoes,
      dataCadastro: data?.dataCadastro || new Date().toISOString(),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? 'Editar Categoria de Despesa' : 'Nova Categoria de Despesa'}
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} a categoria de despesa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <Tabs defaultValue="dados">
            <TabsList className="w-full">
              <TabsTrigger value="dados" className="flex-1">
                Dados Gerais
              </TabsTrigger>
              <TabsTrigger value="traducao" className="flex-1">
                Tradução
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-4 mt-4">
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
                <ColorPicker
                  value={formData.cor}
                  onChange={(cor) => setFormData((current) => ({ ...current, cor }))}
                  disabled={readOnly}
                  previewLabel={formData.titulo}
                />
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
                  placeholder="Descricao da categoria de despesa..."
                  disabled={readOnly}
                />
              </div>
            </TabsContent>

            <TabsContent value="traducao">
              <TraducaoTab
                traducoes={traducoes}
                onChange={(lang, value) => setTraducoes({ ...traducoes, [lang]: value })}
                readOnly={readOnly}
              />
            </TabsContent>
          </Tabs>

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

export default CategoriaDespesaFormModal;
