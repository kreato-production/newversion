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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';
import { SateliteChecklistTab, type Checklist } from '@/components/satops/SateliteChecklistTab';
import type { SateliteItem } from '@/views/satops/Satelites';

const POLARIZACAO_OPTIONS = ['Horizontal', 'Vertical', 'LHCP', 'RDCP'];
const FEC_OPTIONS = ['3/4', '2/3', '7/8', '5/6'];

interface SateliteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SateliteItem) => Promise<void>;
  data?: SateliteItem | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

type FormState = {
  codigoExterno: string;
  nome: string;
  transponder: string;
  frequenciaUplink: string;
  polarizacao: string;
  symbolRate: string;
  fec: string;
};

const EMPTY_FORM: FormState = {
  codigoExterno: '',
  nome: '',
  transponder: '',
  frequenciaUplink: '',
  polarizacao: '',
  symbolRate: '',
  fec: '',
};

export const SateliteFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: SateliteFormModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [traducoes, setTraducoes] = useState<Traducoes>({});
  const [checklist, setChecklist] = useState<Checklist>([]);

  useEffect(() => {
    if (isOpen) {
      if (data) {
        setFormData({
          codigoExterno: data.codigoExterno || '',
          nome: data.nome || '',
          transponder: data.transponder || '',
          frequenciaUplink: data.frequenciaUplink || '',
          polarizacao: data.polarizacao || '',
          symbolRate: data.symbolRate || '',
          fec: data.fec || '',
        });
        setTraducoes((data.traducoes as Traducoes) ?? {});
        setChecklist((data.checklist as Checklist) ?? []);
      } else {
        setFormData(EMPTY_FORM);
        setTraducoes({});
        setChecklist([]);
      }
    }
  }, [data, isOpen]);

  const set = (key: keyof FormState) => (value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      aberturaPrevirta: data?.aberturaPrevirta ?? '',
      fechoPrevirto: data?.fechoPrevirto ?? '',
      aberturaReal: data?.aberturaReal ?? '',
      fechoReal: data?.fechoReal ?? '',
      checklist,
      traducoes,
      dataCadastro: data?.dataCadastro || new Date().toISOString(),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Satélite' : 'Novo Satélite'}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} o satélite.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <Tabs defaultValue="dados">
            <TabsList className="w-full">
              <TabsTrigger value="dados" className="flex-1">
                Dados Gerais
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex-1">
                Checklist
              </TabsTrigger>
              <TabsTrigger value="traducao" className="flex-1">
                Tradução
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-5 mt-4">
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
                    onChange={(e) => set('codigoExterno')(e.target.value)}
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
                    onChange={(e) => set('nome')(e.target.value)}
                    maxLength={100}
                    required
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Separador: Parâmetros Técnicos */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Parâmetros Técnicos
                  </span>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transponder">Transponder</Label>
                    <Input
                      id="transponder"
                      value={formData.transponder}
                      onChange={(e) => set('transponder')(e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequenciaUplink">Frequência Uplink (MHz)</Label>
                    <Input
                      id="frequenciaUplink"
                      value={formData.frequenciaUplink}
                      onChange={(e) => set('frequenciaUplink')(e.target.value)}
                      placeholder="Ex.: 14250"
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Polarização</Label>
                    <Select
                      value={formData.polarizacao}
                      onValueChange={set('polarizacao')}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {POLARIZACAO_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbolRate">Symbol Rate (Msps)</Label>
                    <Input
                      id="symbolRate"
                      value={formData.symbolRate}
                      onChange={(e) => set('symbolRate')(e.target.value)}
                      placeholder="Ex.: 27500"
                      disabled={readOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>FEC</Label>
                    <Select value={formData.fec} onValueChange={set('fec')} disabled={readOnly}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FEC_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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

            <TabsContent value="checklist">
              <SateliteChecklistTab
                checklist={checklist}
                onChange={setChecklist}
                readOnly={readOnly}
              />
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

export default SateliteFormModal;
