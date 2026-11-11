import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormPage } from '@/components/shared/FormPage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecordForm } from '@/hooks/useRecordForm';
import { useRecordNavigation } from '@/hooks/useRecordNavigation';
import { ALERTAS_ROUTES, JANELA_TIME_FIELDS } from '@/modules/satops/alertas.navigation';
import { ApiSatOpsRepository, type AlertaApiItem } from '@/modules/satops/satops.api.repository';

const repository = new ApiSatOpsRepository();

interface AlertaFormValues {
  id?: string;
  nome: string;
  tempoParaAlerta: string;
  regra: string;
  campoReferencia: string;
}

const EMPTY: AlertaFormValues = {
  nome: '',
  tempoParaAlerta: '00:30:00',
  regra: 'Antes',
  campoReferencia: 'fechoPrevisto',
};

function toInput(item: AlertaApiItem): AlertaFormValues {
  return {
    id: item.id,
    nome: item.nome || '',
    tempoParaAlerta: item.tempoParaAlerta || EMPTY.tempoParaAlerta,
    regra: item.regra || EMPTY.regra,
    campoReferencia: item.campoReferencia || EMPTY.campoReferencia,
  };
}

const PERMISSION = ['SatOps', 'Parametrizações', 'Alertas'] as const;

const AlertaForm = ({ id }: { id?: string }) => {
  const { canIncluir, canAlterar } = usePermissions();
  const { goBack, navigation } = useRecordNavigation(ALERTAS_ROUTES, id);
  const readOnly = id ? !canAlterar(...PERMISSION) : !canIncluir(...PERMISSION);

  const form = useRecordForm<AlertaApiItem, AlertaFormValues>({
    id,
    empty: EMPTY,
    load: (recordId) => repository.getAlerta(recordId),
    toInput,
    save: (values) =>
      repository.saveAlerta({
        ...(values.id ? { id: values.id } : {}),
        nome: values.nome,
        tempoParaAlerta: values.tempoParaAlerta,
        regra: values.regra,
        campoReferencia: values.campoReferencia,
      }),
    onSaved: goBack,
    readOnly,
    messages: { created: 'Alerta cadastrado!', updated: 'Alerta atualizado!' },
  });
  const { isEditing, record, formData, update, handleSubmit } = form;
  const disabled = readOnly || form.isSubmitting;

  return (
    <FormPage
      title={isEditing ? record?.nome || 'Editar Alerta' : 'Novo Alerta'}
      description={`Preencha os campos abaixo para ${isEditing ? 'editar' : 'cadastrar'} o alerta.`}
      formId="alerta-form"
      onBack={goBack}
      isEditing={isEditing}
      readOnly={readOnly}
      isLoading={form.isLoading}
      isSubmitting={form.isSubmitting}
      loadError={form.loadError}
      notFoundTitle="Alerta não encontrado"
      navigation={navigation}
      createLabel="Salvar"
    >
      <form id="alerta-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => update('nome', e.target.value)}
            maxLength={100}
            required
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="tempoParaAlerta">
              Tempo para Alerta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tempoParaAlerta"
              type="time"
              step="1"
              value={formData.tempoParaAlerta}
              onChange={(e) => update('tempoParaAlerta', e.target.value)}
              required
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">Formato HH:MM:SS</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="regra">
              Regra <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.regra}
              onValueChange={(v) => update('regra', v)}
              disabled={disabled}
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
          <div className="space-y-2">
            <Label htmlFor="campoReferencia">
              Campo de Referência <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.campoReferencia}
              onValueChange={(v) => update('campoReferencia', v)}
              disabled={disabled}
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
        </div>

        {record && (
          <div className="grid grid-cols-1 gap-4 pt-2 border-t md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Usuário de Cadastro</p>
              <p className="text-sm">{record.usuarioCadastro || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Data de Cadastro</p>
              <p className="text-sm">
                {record.dataCadastro
                  ? new Date(record.dataCadastro).toLocaleDateString('pt-BR')
                  : '-'}
              </p>
            </div>
          </div>
        )}
      </form>
    </FormPage>
  );
};

export default AlertaForm;
