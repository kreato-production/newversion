import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage } from '@/contexts/LanguageContext';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { ServicosTab } from './ServicosTab';
import { FornecedorArquivosTab } from './FornecedorArquivosTab';
import { fornecedoresRepository } from '@/modules/fornecedores/fornecedores.repository.provider';
import type {
  CategoriaFornecedorOption,
  Fornecedor,
  FornecedorInput,
} from '@/modules/fornecedores/fornecedores.types';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';

const PAISES = [
  'Brasil',
  'Portugal',
  'Espanha',
  'Estados Unidos',
  'Argentina',
  'Chile',
  'Colômbia',
  'México',
  'Peru',
  'Uruguai',
  'Alemanha',
  'França',
  'Itália',
  'Reino Unido',
  'Canadá',
  'Austrália',
  'Japão',
  'China',
  'Índia',
];

const emptyFormData: FornecedorInput = {
  codigoExterno: '',
  nome: '',
  categoria: '',
  categoriaId: '',
  email: '',
  pais: '',
  identificacaoFiscal: '',
  descricao: '',
};

function toFormData(data: Fornecedor | null): FornecedorInput {
  if (!data) return { ...emptyFormData };
  return {
    id: data.id,
    codigoExterno: data.codigoExterno,
    nome: data.nome,
    categoria: data.categoria,
    categoriaId: data.categoriaId || '',
    email: data.email,
    pais: data.pais,
    identificacaoFiscal: data.identificacaoFiscal,
    descricao: data.descricao,
  };
}

/** Fields of the Fornecedor cadastro (with Serviços and Arquivos tabs), inside a `RecordFormPage`. */
export const FornecedorFormBody = ({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<Fornecedor, FornecedorInput>) => {
  const { t } = useLanguage();
  const { isVisible } = usePermissions();
  const [categorias, setCategorias] = useState<CategoriaFornecedorOption[]>([]);
  const [formData, setFormData] = useState<FornecedorInput>(() => toFormData(data));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCategorias = async () => {
      const options = await fornecedoresRepository.listOptions();
      setCategorias(options.categorias);
    };

    void loadCategorias();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs defaultValue="dados" className="w-full">
      <TabsList>
        <TabsTrigger value="dados">{t('field.generalData')}</TabsTrigger>
        {isVisible('Recursos', 'Fornecedores', '-', 'Tabulador "Serviços"') && (
          <TabsTrigger value="servicos" disabled={!data}>
            {t('field.services')}
          </TabsTrigger>
        )}
        <TabsTrigger value="arquivos" disabled={!data}>
          {t('field.files')}
        </TabsTrigger>
      </TabsList>

      {/* Kept mounted (hidden when inactive) so the page's Save button finds the form from any tab. */}
      <TabsContent value="dados" forceMount className="data-[state=inactive]:hidden">
        <form id={formId} onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                disabled={readOnly}
                onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">{t('common.name')}</Label>
              <Input
                id="nome"
                value={formData.nome}
                disabled={readOnly}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.category')}</Label>
              <SearchableSelect
                options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
                value={formData.categoriaId || ''}
                onValueChange={(value) => {
                  const selected = categorias.find((c) => c.id === value);
                  setFormData({
                    ...formData,
                    categoriaId: value,
                    categoria: selected?.nome || '',
                  });
                }}
                placeholder={t('common.select')}
                searchPlaceholder="Pesquisar categoria..."
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled={readOnly}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('common.country')}</Label>
              <SearchableSelect
                options={PAISES.map((pais) => ({ value: pais, label: pais }))}
                value={formData.pais}
                onValueChange={(value) => setFormData({ ...formData, pais: value })}
                placeholder={t('common.select')}
                searchPlaceholder="Pesquisar país..."
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="identificacaoFiscal">{t('field.fiscalId')}</Label>
              <Input
                id="identificacaoFiscal"
                value={formData.identificacaoFiscal}
                disabled={readOnly}
                onChange={(e) => setFormData({ ...formData, identificacaoFiscal: e.target.value })}
                maxLength={100}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">{t('common.description')}</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              disabled={readOnly}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>
        </form>
      </TabsContent>

      {isVisible('Recursos', 'Fornecedores', '-', 'Tabulador "Serviços"') && (
        <TabsContent value="servicos">
          {data && <ServicosTab fornecedorId={data.id} readOnly={readOnly} />}
        </TabsContent>
      )}
      <TabsContent value="arquivos">
        {data && <FornecedorArquivosTab fornecedorId={data.id} readOnly={readOnly} />}
      </TabsContent>
    </Tabs>
  );
};
