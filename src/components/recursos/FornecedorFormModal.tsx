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
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';

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

interface FornecedorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FornecedorInput) => Promise<void>;
  data?: Fornecedor | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

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

export const FornecedorFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: FornecedorFormModalProps) => {
  const { t } = useLanguage();
  const { isVisible } = usePermissions();
  const [categorias, setCategorias] = useState<CategoriaFornecedorOption[]>([]);
  const [formData, setFormData] = useState<FornecedorInput>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCategorias = async () => {
      if (!isOpen) {
        return;
      }

      const options = await fornecedoresRepository.listOptions();
      setCategorias(options.categorias);
    };

    void loadCategorias();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (data) {
      setFormData({
        id: data.id,
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        categoria: data.categoria,
        categoriaId: data.categoriaId || '',
        email: data.email,
        pais: data.pais,
        identificacaoFiscal: data.identificacaoFiscal,
        descricao: data.descricao,
      });
      return;
    }

    setFormData(emptyFormData);
  }, [data, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? t('field.editSupplier') : t('field.newSupplier')}</DialogTitle>
          <DialogDescription>{t('field.fillSupplierData')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
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

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                    onChange={(e) =>
                      setFormData({ ...formData, identificacaoFiscal: e.target.value })
                    }
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

              <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
                {navigation && <ModalNavigation {...navigation} />}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    {readOnly ? 'Fechar' : t('common.cancel')}
                  </Button>
                  {!readOnly && (
                    <Button
                      type="submit"
                      className="gradient-primary hover:opacity-90"
                      disabled={isSubmitting}
                    >
                      {t('common.save')}
                    </Button>
                  )}
                </div>
              </DialogFooter>
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
      </DialogContent>
    </Dialog>
  );
};
