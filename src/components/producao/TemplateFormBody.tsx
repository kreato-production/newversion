import { useState } from 'react';
import { LayoutList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EtapasTab, type Etapa } from './EtapasTab';
import { PlanoProducaoModal } from './PlanoProducaoModal';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import {
  type Template,
  type SaveTemplateInput,
  etapasToInput,
  etapasFromTemplate,
} from '@/modules/templates/templates.api';

/** Fields of the Template cadastro (with its production stages), inside a `RecordFormPage`. */
export function TemplateFormBody({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<Template, SaveTemplateInput>) {
  const [nome, setNome] = useState(() => data?.nome ?? '');
  const [descricao, setDescricao] = useState(() => data?.descricao ?? '');
  const [estado, setEstado] = useState<'Ativo' | 'Inativo'>(
    () => (data?.estado as 'Ativo' | 'Inativo') ?? 'Ativo',
  );
  const [etapas, setEtapas] = useState<Etapa[]>(() => (data ? etapasFromTemplate(data) : []));
  const [saving, setSaving] = useState(false);
  const [showPlano, setShowPlano] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || saving || !nome.trim()) return;

    for (const etapa of etapas) {
      for (const atividade of etapa.atividades) {
        if (!atividade.nome.trim()) {
          toast({
            title: 'Nome da atividade obrigatório',
            description: `Preencha o nome de todas as atividades da etapa "${etapa.nome}" antes de salvar.`,
            variant: 'destructive',
          });
          return;
        }
        if (!atividade.horaInicio || !atividade.horaFim) {
          toast({
            title: 'Horário da atividade obrigatório',
            description: `Preencha o início e fim da atividade "${atividade.nome || '(sem nome)'}" na etapa "${etapa.nome}".`,
            variant: 'destructive',
          });
          return;
        }
      }
    }

    setSaving(true);
    try {
      await onSubmit({
        id: data?.id,
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        estado,
        etapas: etapasToInput(etapas),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form id={formId} onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPlano(true)}
            disabled={etapas.length === 0}
          >
            <LayoutList className="h-4 w-4 mr-2" />
            Plano de Produção
          </Button>
        </div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList>
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
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={estado}
                onValueChange={(v) => setEstado(v as 'Ativo' | 'Inativo')}
                disabled={readOnly}
              >
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="etapas" className="mt-4">
            <EtapasTab etapas={etapas} onChange={setEtapas} readOnly={readOnly} />
          </TabsContent>
        </Tabs>
      </form>

      <PlanoProducaoModal
        isOpen={showPlano}
        onClose={() => setShowPlano(false)}
        etapas={etapas}
        titulo={nome}
      />
    </>
  );
}
