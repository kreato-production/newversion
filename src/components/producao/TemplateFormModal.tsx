import { useEffect, useState } from 'react';
import { LayoutList, Loader2 } from 'lucide-react';
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
import { EtapasTab, type Etapa } from './EtapasTab';
import { PlanoProducaoModal } from './PlanoProducaoModal';
import {
  type Template,
  type SaveTemplateInput,
  etapasToInput,
  etapasFromTemplate,
} from '@/modules/templates/templates.api';

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: SaveTemplateInput) => Promise<void>;
  data?: Template | null;
  readOnly?: boolean;
}

export function TemplateFormModal({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
}: TemplateFormModalProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPlano, setShowPlano] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (data) {
      setNome(data.nome);
      setDescricao(data.descricao ?? '');
      setEtapas(etapasFromTemplate(data));
    } else {
      setNome('');
      setDescricao('');
      setEtapas([]);
    }
  }, [data, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    try {
      await onSave({
        id: data?.id,
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        etapas: etapasToInput(etapas),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[1100px] max-w-[1100px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{data ? 'Editar Template' : 'Novo Template'}</DialogTitle>
            <DialogDescription>
              {data
                ? 'Edite os dados e etapas deste template de produção.'
                : 'Preencha os dados e defina as etapas do template de produção.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 mt-2">
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
                <TabsTrigger value="etapas">Etapas</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    disabled={readOnly}
                    placeholder="Nome do template"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    disabled={readOnly}
                    placeholder="Descrição opcional do template"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="etapas" className="mt-4">
                <EtapasTab etapas={etapas} onChange={setEtapas} readOnly={readOnly} />
              </TabsContent>
            </Tabs>

            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPlano(true)}
                disabled={etapas.length === 0}
              >
                <LayoutList className="h-4 w-4 mr-2" />
                Plano de Produção
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  {readOnly ? 'Fechar' : 'Cancelar'}
                </Button>
                {!readOnly && (
                  <Button
                    type="submit"
                    className="gradient-primary hover:opacity-90"
                    disabled={saving || !nome.trim()}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Salvar
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PlanoProducaoModal
        isOpen={showPlano}
        onClose={() => setShowPlano(false)}
        etapas={etapas}
        titulo={nome}
      />
    </>
  );
}
