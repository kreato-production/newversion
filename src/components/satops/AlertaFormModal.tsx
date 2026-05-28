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
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import type { AlertaApiItem } from '@/modules/satops/satops.api.repository';

// HH:MM fields from the Janelas cadastro
export const JANELA_TIME_FIELDS = [
  { key: 'aberturaPrevia', label: 'Abertura Prévia' },
  { key: 'aberturaReal', label: 'Abertura Real' },
  { key: 'fechoPrevisto', label: 'Fecho Previsto' },
  { key: 'fechoReal', label: 'Fecho Real' },
] as const;

interface AlertaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AlertaApiItem) => Promise<void>;
  data?: AlertaApiItem | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

export const AlertaFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: AlertaFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    tempoParaAlerta: '00:30:00',
    regra: 'Antes',
    campoReferencia: 'fechoPrevisto',
  });

  useEffect(() => {
    if (isOpen) {
      if (data) {
        setFormData({
          nome: data.nome || '',
          tempoParaAlerta: data.tempoParaAlerta || '00:30:00',
          regra: data.regra || 'Antes',
          campoReferencia: data.campoReferencia || 'fechoPrevisto',
        });
      } else {
        setFormData({
          nome: '',
          tempoParaAlerta: '00:30:00',
          regra: 'Antes',
          campoReferencia: 'fechoPrevisto',
        });
      }
    }
  }, [data, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <DialogContent className="w-[600px] max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Alerta' : 'Novo Alerta'}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} o alerta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-4 py-2">
            {data?.id && (
              <div className="space-y-2">
                <Label>ID</Label>
                <Input value={data.id} disabled className="font-mono text-xs" />
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempoParaAlerta">
                  Tempo para Alerta <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tempoParaAlerta"
                  type="time"
                  step="1"
                  value={formData.tempoParaAlerta}
                  onChange={(e) => setFormData({ ...formData, tempoParaAlerta: e.target.value })}
                  required
                  disabled={readOnly}
                />
                <p className="text-xs text-muted-foreground">Formato HH:MM:SS</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regra">
                  Regra <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.regra}
                  onValueChange={(v) => setFormData({ ...formData, regra: v })}
                  disabled={readOnly}
                >
                  <SelectTrigger id="regra">
                    <SelectValue placeholder="Selecione a regra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Antes">Antes</SelectItem>
                    <SelectItem value="Depois">Depois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campoReferencia">
                Campo de Referência <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.campoReferencia}
                onValueChange={(v) => setFormData({ ...formData, campoReferencia: v })}
                disabled={readOnly}
              >
                <SelectTrigger id="campoReferencia">
                  <SelectValue placeholder="Selecione o campo" />
                </SelectTrigger>
                <SelectContent>
                  {JANELA_TIME_FIELDS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>

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

export default AlertaFormModal;
