import { useEffect, useState } from 'react';
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
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import {
  ConfigurableFieldGrid,
  FieldAsterisk,
  useFormFieldConfig,
} from '@/hooks/useFormFieldConfig';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { ApiFornecedoresRepository } from '@/modules/fornecedores/fornecedores.api.repository';
import type { ContaPagar, SaveContaPagarInput } from '@/modules/financeiro/contas-pagar.api';

const parametrizacoesRepo = new ApiParametrizacoesRepository();
const fornecedoresRepo = new ApiFornecedoresRepository();

const NONE = '__none__';

const emptyForm: SaveContaPagarInput = {
  numeroDocumento: '',
  descricao: '',
  fornecedorId: null,
  dataEmissao: '',
  dataVencimento: '',
  dataPagamento: '',
  valor: null,
  valorPago: null,
  statusId: null,
  categoriaId: null,
  formaPagamentoId: null,
  tipoDocumentoId: null,
  observacoes: '',
};

function toFormData(data: ContaPagar | null): SaveContaPagarInput {
  if (!data) return { ...emptyForm };
  return {
    id: data.id,
    numeroDocumento: data.numeroDocumento || '',
    descricao: data.descricao || '',
    fornecedorId: data.fornecedorId || null,
    dataEmissao: data.dataEmissao || '',
    dataVencimento: data.dataVencimento || '',
    dataPagamento: data.dataPagamento || '',
    valor: data.valor ?? null,
    valorPago: data.valorPago ?? null,
    statusId: data.statusId || null,
    categoriaId: data.categoriaId || null,
    formaPagamentoId: data.formaPagamentoId || null,
    tipoDocumentoId: data.tipoDocumentoId || null,
    observacoes: data.observacoes || '',
  };
}

/** Fields of the Conta a Pagar cadastro, inside a `RecordFormPage`. */
export const ContaPagarFormBody = ({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<ContaPagar, SaveContaPagarInput>) => {
  const [formData, setFormData] = useState<SaveContaPagarInput>(() => toFormData(data));
  const [isSaving, setIsSaving] = useState(false);
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('contaPagar');
  /** Label of a field: translation configured in Formulários + required/suggested asterisk. */
  const label = (campo: string, text: string, alwaysRequired = false) => (
    <>
      {fieldLabel(campo, text)}
      <FieldAsterisk type={getAsterisk(campo, alwaysRequired)} />
    </>
  );

  const [statusList, setStatusList] = useState<{ id: string; titulo: string; cor: string }[]>([]);
  const [categoriaList, setCategoriaList] = useState<{ id: string; titulo: string }[]>([]);
  const [formaPagamentoList, setFormaPagamentoList] = useState<{ id: string; titulo: string }[]>(
    [],
  );
  const [tipoDocumentoList, setTipoDocumentoList] = useState<{ id: string; titulo: string }[]>([]);
  const [fornecedoresList, setFornecedoresList] = useState<{ id: string; nome: string }[]>([]);

  // Load lookup data once
  useEffect(() => {
    void parametrizacoesRepo
      .listStatusContasPagar()
      .then((r) => setStatusList(r.data.map((s) => ({ id: s.id, titulo: s.titulo, cor: s.cor }))));
    void parametrizacoesRepo
      .listCategoriasDespesa()
      .then((r) => setCategoriaList(r.data.map((s) => ({ id: s.id, titulo: s.titulo }))));
    void parametrizacoesRepo
      .listFormasPagamento()
      .then((r) => setFormaPagamentoList(r.data.map((s) => ({ id: s.id, titulo: s.titulo }))));
    void parametrizacoesRepo
      .listTiposDocumentosFinanceiro()
      .then((r) => setTipoDocumentoList(r.data.map((s) => ({ id: s.id, titulo: s.titulo }))));
    void fornecedoresRepo
      .list()
      .then((list) => setFornecedoresList(list.map((f) => ({ id: f.id, nome: f.nome }))));
  }, []);

  const set = (field: keyof SaveContaPagarInput, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || isSaving) return;
    if (
      !validate({
        numeroDocumento: formData.numeroDocumento,
        fornecedorId: formData.fornecedorId,
        descricao: formData.descricao,
        dataEmissao: formData.dataEmissao,
        dataVencimento: formData.dataVencimento,
        dataPagamento: formData.dataPagamento,
        valor: formData.valor,
        valorPago: formData.valorPago,
        statusId: formData.statusId,
        categoriaId: formData.categoriaId,
        formaPagamentoId: formData.formaPagamentoId,
        tipoDocumentoId: formData.tipoDocumentoId,
        observacoes: formData.observacoes,
      })
    )
      return;
    setIsSaving(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form id={formId} onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <ConfigurableFieldGrid>
        <div className="space-y-1" {...fieldLayout('numeroDocumento')}>
          <Label htmlFor="numeroDocumento">{label('numeroDocumento', 'Nº Documento')}</Label>
          <Input
            id="numeroDocumento"
            value={formData.numeroDocumento ?? ''}
            onChange={(e) => set('numeroDocumento', e.target.value)}
            disabled={readOnly}
            placeholder="Ex.: NF-001"
          />
        </div>
        <div className="space-y-1" {...fieldLayout('fornecedorId')}>
          <Label>{label('fornecedorId', 'Fornecedor')}</Label>
          <Select
            value={formData.fornecedorId ?? NONE}
            onValueChange={(v) => set('fornecedorId', v === NONE ? null : v)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— Nenhum —</SelectItem>
              {fornecedoresList.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1" {...fieldLayout('descricao')}>
          <Label htmlFor="descricao">{label('descricao', 'Descrição', true)}</Label>
          <Input
            id="descricao"
            value={formData.descricao}
            onChange={(e) => set('descricao', e.target.value)}
            disabled={readOnly}
            required
            placeholder="Descrição da conta a pagar"
          />
        </div>

        <div className="space-y-1" {...fieldLayout('dataEmissao')}>
          <Label htmlFor="dataEmissao">{label('dataEmissao', 'Data Emissão')}</Label>
          <Input
            id="dataEmissao"
            type="date"
            value={formData.dataEmissao ?? ''}
            onChange={(e) => set('dataEmissao', e.target.value)}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-1" {...fieldLayout('dataVencimento')}>
          <Label htmlFor="dataVencimento">{label('dataVencimento', 'Vencimento', true)}</Label>
          <Input
            id="dataVencimento"
            type="date"
            value={formData.dataVencimento}
            onChange={(e) => set('dataVencimento', e.target.value)}
            disabled={readOnly}
            required
          />
        </div>
        <div className="space-y-1" {...fieldLayout('dataPagamento')}>
          <Label htmlFor="dataPagamento">{label('dataPagamento', 'Data Pagamento')}</Label>
          <Input
            id="dataPagamento"
            type="date"
            value={formData.dataPagamento ?? ''}
            onChange={(e) => set('dataPagamento', e.target.value)}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-1" {...fieldLayout('valor')}>
          <Label htmlFor="valor">{label('valor', 'Valor (R$)', true)}</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            min="0"
            value={formData.valor ?? ''}
            onChange={(e) => set('valor', e.target.value ? parseFloat(e.target.value) : null)}
            disabled={readOnly}
            required
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1" {...fieldLayout('valorPago')}>
          <Label htmlFor="valorPago">{label('valorPago', 'Valor Pago (R$)')}</Label>
          <Input
            id="valorPago"
            type="number"
            step="0.01"
            min="0"
            value={formData.valorPago ?? ''}
            onChange={(e) => set('valorPago', e.target.value ? parseFloat(e.target.value) : null)}
            disabled={readOnly}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-1" {...fieldLayout('statusId')}>
          <Label>{label('statusId', 'Status')}</Label>
          <Select
            value={formData.statusId ?? NONE}
            onValueChange={(v) => set('statusId', v === NONE ? null : v)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— Nenhum —</SelectItem>
              {statusList.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1" {...fieldLayout('categoriaId')}>
          <Label>{label('categoriaId', 'Categoria de Despesa')}</Label>
          <Select
            value={formData.categoriaId ?? NONE}
            onValueChange={(v) => set('categoriaId', v === NONE ? null : v)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— Nenhuma —</SelectItem>
              {categoriaList.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1" {...fieldLayout('formaPagamentoId')}>
          <Label>{label('formaPagamentoId', 'Forma de Pagamento')}</Label>
          <Select
            value={formData.formaPagamentoId ?? NONE}
            onValueChange={(v) => set('formaPagamentoId', v === NONE ? null : v)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a forma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— Nenhuma —</SelectItem>
              {formaPagamentoList.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1" {...fieldLayout('tipoDocumentoId')}>
          <Label>{label('tipoDocumentoId', 'Tipo de Documento')}</Label>
          <Select
            value={formData.tipoDocumentoId ?? NONE}
            onValueChange={(v) => set('tipoDocumentoId', v === NONE ? null : v)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— Nenhum —</SelectItem>
              {tipoDocumentoList.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1" {...fieldLayout('observacoes')}>
          <Label htmlFor="observacoes">{label('observacoes', 'Observações')}</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes ?? ''}
            onChange={(e) => set('observacoes', e.target.value)}
            disabled={readOnly}
            rows={3}
            placeholder="Observações adicionais..."
          />
        </div>
      </ConfigurableFieldGrid>
    </form>
  );
};
