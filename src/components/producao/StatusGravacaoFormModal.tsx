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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';
import { type StatusGravacaoItem } from '@/views/producao/StatusGravacao';

interface StatusGravacaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StatusGravacaoItem) => Promise<void>;
  data?: StatusGravacaoItem | null;
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

export const StatusGravacaoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: StatusGravacaoFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    descricao: '',
    cor: '#3b82f6',
  });
  const [traducoes, setTraducoes] = useState<Traducoes>({});

  useEffect(() => {
    if (isOpen) {
      if (data) {
        setFormData({
          codigoExterno: data.codigoExterno || '',
          nome: data.nome || '',
          descricao: data.descricao || '',
          cor: data.cor || '#3b82f6',
        });
        setTraducoes((data.traducoes as Traducoes) ?? {});
      } else {
        setFormData({ codigoExterno: '', nome: '', descricao: '', cor: '#3b82f6' });
        setTraducoes({});
      }
    }
  }, [data, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      isInicial: data?.isInicial || false,
      traducoes,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Status' : 'Novo Status'}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} o status.
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    maxLength={10}
                    placeholder="Máx. 10 caracteres"
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
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 flex-wrap">
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
                          onClick={() => setFormData({ ...formData, cor: color })}
                          disabled={readOnly}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-14 h-10 p-1 cursor-pointer"
                      disabled={readOnly}
                    />
                    <Input
                      type="text"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      placeholder="#000000"
                      className="w-28 font-mono text-xs"
                      disabled={readOnly}
                    />
                    <Badge style={{ backgroundColor: formData.cor }} className="text-white ml-auto">
                      {formData.nome || 'Preview'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  placeholder="Descrição do status..."
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

export default StatusGravacaoFormModal;
