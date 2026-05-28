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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';
import type { EstadoEventoItem } from '@/views/satops/EstadosEvento';

interface EstadoEventoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EstadoEventoItem) => Promise<void>;
  data?: EstadoEventoItem | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

export const EstadoEventoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: EstadoEventoFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    cor: '#3b82f6',
  });
  const [traducoes, setTraducoes] = useState<Traducoes>({});

  useEffect(() => {
    if (isOpen) {
      if (data) {
        setFormData({
          codigoExterno: data.codigoExterno || '',
          nome: data.nome || '',
          cor: data.cor || '#3b82f6',
        });
        setTraducoes((data.traducoes as Traducoes) ?? {});
      } else {
        setFormData({ codigoExterno: '', nome: '', cor: '#3b82f6' });
        setTraducoes({});
      }
    }
  }, [data, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <DialogContent className="w-[800px] max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Estado de Evento' : 'Novo Estado de Evento'}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} o estado de evento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
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
              {data?.id && (
                <div className="space-y-2">
                  <Label>ID</Label>
                  <Input value={data.id} disabled className="font-mono text-xs" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    maxLength={20}
                    placeholder="Máx. 20 caracteres"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    maxLength={100}
                    required
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <ColorPicker
                  value={formData.cor}
                  onChange={(cor) => setFormData({ ...formData, cor })}
                  disabled={readOnly}
                  previewLabel={formData.nome}
                />
              </div>

              {data && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Usuário de Cadastro</Label>
                    <p className="text-sm">{data.usuarioCadastro || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Data de Cadastro</Label>
                    <p className="text-sm">
                      {data.dataCadastro
                        ? new Date(data.dataCadastro).toLocaleDateString('pt-BR')
                        : '-'}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="traducao">
              <TraducaoTab
                traducoes={traducoes}
                onChange={(lang, value) => setTraducoes({ ...traducoes, [lang]: value })}
                readOnly={readOnly}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className={`mt-4 ${navigation ? 'sm:justify-between' : ''}`}>
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

export default EstadoEventoFormModal;
