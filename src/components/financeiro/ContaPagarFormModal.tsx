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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { ApiFornecedoresRepository } from '@/modules/fornecedores/fornecedores.api.repository';
import type { ContaPagar, SaveContaPagarInput } from '@/modules/financeiro/contas-pagar.api';

interface ContaPagarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveContaPagarInput) => Promise<void>;
  data?: ContaPagar | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

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

export const ContaPagarFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: ContaPagarFormModalProps) => {
  const [formData, setFormData] = useState<SaveContaPagarInput>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [statusList, setStatusList] = useState<{ id: string; titulo: string; cor: string }[]>([]);
  const [categoriaList, setCategoriaList] = useState<{ id: string; titulo: string }[]>([]);
  const [formaPagamentoList, setFormaPagamentoList] = useState<{ id: string; titulo: string }[]>([]);
  const [tipoDocumentoList, setTipoDocumentoList] = useState<{ id: string; titulo: string }[]>([]);
  const [fornecedoresList, setFornecedoresList] = useState<{ id: string; nome: string }[]>([]);

  // Load lookup data once
  useEffect(() => {
    void parametrizacoesRepo.listStatusContasPagar().then((r) =>
      setStatusList(r.data.map((s) => ({ id: s.id, titulo: s.titulo, cor: s.cor }))),
    );
    void parametrizacoesRepo.listCategoriasDespesa().then((r) =>
      setCategoriaList(r.data.map((s) => ({ id: s.id, titulo: s.titulo }))),
    );
    void parametrizacoesRepo.listFormasPagamento().then((r) =>
      setFormaPagamentoList(r.data.map((s) => ({ id: s.id, titulo: s.titulo }))),
    );
    void parametrizacoesRepo.listTiposDocumentosFinanceiro().then((r) =>
      setTipoDocumentoList(r.data.map((s) => ({ id: s.id, titulo: s.titulo }))),
    );
    void fornecedoresRepo.list().then((list) =>
      setFornecedoresList(list.map((f) => ({ id: f.id, nome: f.nome }))),
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (data) {
      setFormData({
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
      });
    } else {
      setFormData(emptyForm);
    }
  }, [isOpen, data]);

  const set = (field: keyof SaveContaPagarInput, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const title = data ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[700px] max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Preencha os dados da conta a pagar.</DialogDescription>
        </DialogHeader>

        {navigation && <ModalNavigation {...navigation} />}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Row 1: Numero + Fornecedor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="numeroDocumento">Nº Documento</Label>
              <Input
                id="numeroDocumento"
                value={formData.numeroDocumento ?? ''}
                onChange={(e) => set('numeroDocumento', e.target.value)}
                disabled={readOnly}
                placeholder="Ex.: NF-001"
              />
            </div>
            <div className="space-y-1">
              <Label>Fornecedor</Label>
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
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <Label htmlFor="descricao">
              Descrição <span className="text-destructive">*</span>
            </Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              disabled={readOnly}
              required
              placeholder="Descrição da conta a pagar"
            />
          </div>

          {/* Row 2: Datas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="dataEmissao">Data Emissão</Label>
              <Input
                id="dataEmissao"
                type="date"
                value={formData.dataEmissao ?? ''}
                onChange={(e) => set('dataEmissao', e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dataVencimento">
                Vencimento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => set('dataVencimento', e.target.value)}
                disabled={readOnly}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dataPagamento">Data Pagamento</Label>
              <Input
                id="dataPagamento"
                type="date"
                value={formData.dataPagamento ?? ''}
                onChange={(e) => set('dataPagamento', e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Row 3: Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="valor">
                Valor (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor ?? ''}
                onChange={(e) =>
                  set('valor', e.target.value ? parseFloat(e.target.value) : null)
                }
                disabled={readOnly}
                required
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="valorPago">Valor Pago (R$)</Label>
              <Input
                id="valorPago"
                type="number"
                step="0.01"
                min="0"
                value={formData.valorPago ?? ''}
                onChange={(e) =>
                  set('valorPago', e.target.value ? parseFloat(e.target.value) : null)
                }
                disabled={readOnly}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Row 4: Status + Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Status</Label>
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
            <div className="space-y-1">
              <Label>Categoria de Despesa</Label>
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
          </div>

          {/* Row 5: Forma Pagamento + Tipo Documento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Forma de Pagamento</Label>
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
            <div className="space-y-1">
              <Label>Tipo de Documento</Label>
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
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes ?? ''}
              onChange={(e) => set('observacoes', e.target.value)}
              disabled={readOnly}
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

          {!readOnly && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
