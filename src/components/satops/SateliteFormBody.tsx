import { useState } from 'react';
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
import {
  ConfigurableFieldGrid,
  FieldAsterisk,
  useFormFieldConfig,
} from '@/hooks/useFormFieldConfig';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';
import { SateliteChecklistTab, type Checklist } from '@/components/satops/SateliteChecklistTab';
import type { SateliteItem } from '@/views/satops/Satelites';

const POLARIZACAO_OPTIONS = ['Horizontal', 'Vertical', 'LHCP', 'RDCP'];
const FEC_OPTIONS = ['3/4', '2/3', '7/8', '5/6'];

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

/** Fields of the Satélite cadastro (with checklist and translations), inside a `RecordFormPage`. */
export const SateliteFormBody = ({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<SateliteItem, SateliteItem>) => {
  const { user } = useAuth();
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('satelite');
  /** Label of a field: translation configured in Formulários + required/suggested asterisk. */
  const label = (campo: string, text: string, alwaysRequired = false) => (
    <>
      {fieldLabel(campo, text)}
      <FieldAsterisk type={getAsterisk(campo, alwaysRequired)} />
    </>
  );
  const [formData, setFormData] = useState<FormState>(() =>
    data
      ? {
          codigoExterno: data.codigoExterno || '',
          nome: data.nome || '',
          transponder: data.transponder || '',
          frequenciaUplink: data.frequenciaUplink || '',
          polarizacao: data.polarizacao || '',
          symbolRate: data.symbolRate || '',
          fec: data.fec || '',
        }
      : EMPTY_FORM,
  );
  const [traducoes, setTraducoes] = useState<Traducoes>(() => (data?.traducoes as Traducoes) ?? {});
  const [checklist, setChecklist] = useState<Checklist>(() => (data?.checklist as Checklist) ?? []);

  const set = (key: keyof FormState) => (value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate(formData)) return;
    // No client-side id: the page decides create vs update from the URL.
    await onSubmit({
      id: data?.id || '',
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
  };

  return (
    <form id={formId} onSubmit={(e) => void handleSubmit(e)}>
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="traducao">Tradução</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-5 mt-4">
          {data?.id && (
            <div className="space-y-2">
              <Label>ID</Label>
              <Input value={data.id} disabled className="font-mono text-xs" />
            </div>
          )}

          <ConfigurableFieldGrid>
            <div className="space-y-2" {...fieldLayout('codigoExterno')}>
              <Label htmlFor="codigoExterno">{label('codigoExterno', 'Código Externo')}</Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(e) => set('codigoExterno')(e.target.value)}
                maxLength={20}
                placeholder="Máx. 20 caracteres"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2" {...fieldLayout('nome')}>
              <Label htmlFor="nome">{label('nome', 'Nome', true)}</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => set('nome')(e.target.value)}
                maxLength={100}
                required
                disabled={readOnly}
              />
            </div>
          </ConfigurableFieldGrid>

          {/* Separador: Parâmetros Técnicos */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Parâmetros Técnicos
              </span>
              <Separator className="flex-1" />
            </div>

            <ConfigurableFieldGrid>
              <div className="space-y-2" {...fieldLayout('transponder')}>
                <Label htmlFor="transponder">{label('transponder', 'Transponder')}</Label>
                <Input
                  id="transponder"
                  value={formData.transponder}
                  onChange={(e) => set('transponder')(e.target.value)}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2" {...fieldLayout('frequenciaUplink')}>
                <Label htmlFor="frequenciaUplink">
                  {label('frequenciaUplink', 'Frequência Uplink (MHz)')}
                </Label>
                <Input
                  id="frequenciaUplink"
                  value={formData.frequenciaUplink}
                  onChange={(e) => set('frequenciaUplink')(e.target.value)}
                  placeholder="Ex.: 14250"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2" {...fieldLayout('polarizacao')}>
                <Label>{label('polarizacao', 'Polarização')}</Label>
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
              <div className="space-y-2" {...fieldLayout('symbolRate')}>
                <Label htmlFor="symbolRate">{label('symbolRate', 'Symbol Rate (Msps)')}</Label>
                <Input
                  id="symbolRate"
                  value={formData.symbolRate}
                  onChange={(e) => set('symbolRate')(e.target.value)}
                  placeholder="Ex.: 27500"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2" {...fieldLayout('fec')}>
                <Label>{label('fec', 'FEC')}</Label>
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
            </ConfigurableFieldGrid>
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
          <SateliteChecklistTab checklist={checklist} onChange={setChecklist} readOnly={readOnly} />
        </TabsContent>

        <TabsContent value="traducao">
          <TraducaoTab
            traducoes={traducoes}
            onChange={(lang, value) => setTraducoes({ ...traducoes, [lang]: value })}
            readOnly={readOnly}
          />
        </TabsContent>
      </Tabs>
    </form>
  );
};

export default SateliteFormBody;
