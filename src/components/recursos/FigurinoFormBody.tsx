import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Star, Upload } from 'lucide-react';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import {
  FieldAsterisk,
  useFormFieldConfig,
  ConfigurableFieldGrid,
} from '@/hooks/useFormFieldConfig';
import { figurinosRepository } from '@/modules/figurinos/figurinos.repository.provider';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import type {
  Figurino,
  FigurinoImagem,
  FigurinoInput,
  MaterialOption,
  TipoFigurinoOption,
} from '@/modules/figurinos/figurinos.types';

const emptyFormData: FigurinoInput = {
  codigoExterno: '',
  codigoFigurino: '',
  descricao: '',
  tipoFigurino: '',
  tipoFigurinoId: '',
  material: '',
  materialId: '',
  tamanhoPeca: '',
  corPredominante: '#000000',
  corSecundaria: '#ffffff',
  imagens: [],
};

function toFormData(data: Figurino | null): FigurinoInput {
  if (!data) return { ...emptyFormData };
  return {
    id: data.id,
    codigoExterno: data.codigoExterno || '',
    codigoFigurino: data.codigoFigurino || '',
    descricao: data.descricao || '',
    tipoFigurino: data.tipoFigurino || '',
    tipoFigurinoId: data.tipoFigurinoId || '',
    material: data.material || '',
    materialId: data.materialId || '',
    tamanhoPeca: data.tamanhoPeca || '',
    corPredominante: data.corPredominante || '#000000',
    corSecundaria: data.corSecundaria || '#ffffff',
    imagens: data.imagens || [],
  };
}

/** Fields of the Figurino cadastro (with images), inside a `RecordFormPage`. */
export const FigurinoFormBody = ({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<Figurino, FigurinoInput>) => {
  const [tiposFigurino, setTiposFigurino] = useState<TipoFigurinoOption[]>([]);
  const [materiais, setMateriais] = useState<MaterialOption[]>([]);

  const [formData, setFormData] = useState<FigurinoInput>(() => toFormData(data));
  const [imagens, setImagens] = useState<FigurinoImagem[]>(() => data?.imagens || []);
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('figurino');

  const fetchDropdownData = useCallback(async () => {
    try {
      const options = await figurinosRepository.listOptions();
      setTiposFigurino(options.tiposFigurino);
      setMateriais(options.materiais);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  }, []);

  useEffect(() => {
    void fetchDropdownData();
  }, [fetchDropdownData]);

  const handleChange = (field: keyof FigurinoInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const novaImagem: FigurinoImagem = {
          id: crypto.randomUUID(),
          url: reader.result as string,
          isPrincipal: imagens.length === 0,
        };
        setImagens((prev) => [...prev, novaImagem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSetPrincipal = (id: string) => {
    setImagens((prev) => prev.map((img) => ({ ...img, isPrincipal: img.id === id })));
  };

  const handleRemoveImagem = (id: string) => {
    setImagens((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrincipal)) {
        filtered[0].isPrincipal = true;
      }
      return filtered;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const camposValidos = validate({
      codigoExterno: formData.codigoExterno,
      codigoFigurino: formData.codigoFigurino,
      descricao: formData.descricao,
      tipoFigurino: formData.tipoFigurinoId || formData.tipoFigurino,
      material: formData.materialId || formData.material,
      tamanhoPeca: formData.tamanhoPeca,
      corPredominante: formData.corPredominante,
      corSecundaria: formData.corSecundaria,
    });
    if (!camposValidos) return;
    await onSubmit({
      ...formData,
      imagens,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <ConfigurableFieldGrid>
        <div className="space-y-1.5" {...fieldLayout('codigoExterno')}>
          <Label htmlFor="codigoExterno">
            {fieldLabel('codigoExterno', 'Código Externo')}{' '}
            <FieldAsterisk type={getAsterisk('codigoExterno')} />
          </Label>
          <Input
            id="codigoExterno"
            value={formData.codigoExterno}
            disabled={readOnly}
            onChange={(e) => handleChange('codigoExterno', e.target.value)}
            placeholder="Código externo"
          />
        </div>
        <div className="space-y-1.5" {...fieldLayout('codigoFigurino')}>
          <Label htmlFor="codigoFigurino">
            {fieldLabel('codigoFigurino', 'Código do Figurino')}{' '}
            <FieldAsterisk type={getAsterisk('codigoFigurino', true)} />
          </Label>
          <Input
            id="codigoFigurino"
            value={formData.codigoFigurino}
            disabled={readOnly}
            onChange={(e) => handleChange('codigoFigurino', e.target.value)}
            placeholder="FIG-001"
            required
          />
        </div>

        <div className="space-y-1.5" {...fieldLayout('descricao')}>
          <Label htmlFor="descricao">
            {fieldLabel('descricao', 'Descrição')}{' '}
            <FieldAsterisk type={getAsterisk('descricao', true)} />
          </Label>
          <Input
            id="descricao"
            value={formData.descricao}
            disabled={readOnly}
            onChange={(e) => handleChange('descricao', e.target.value)}
            placeholder="Descrição do figurino"
            required
          />
        </div>

        <div className="space-y-1.5" {...fieldLayout('tipoFigurino')}>
          <Label htmlFor="tipoFigurino">
            {fieldLabel('tipoFigurino', 'Tipo de Figurino')}{' '}
            <FieldAsterisk type={getAsterisk('tipoFigurino')} />
          </Label>
          <SearchableSelect
            options={tiposFigurino.map((item) => ({ value: item.id, label: item.nome }))}
            value={formData.tipoFigurinoId || ''}
            onValueChange={(value) => {
              const selected = tiposFigurino.find((item) => item.id === value);
              setFormData((prev) => ({
                ...prev,
                tipoFigurinoId: value,
                tipoFigurino: selected?.nome || '',
              }));
            }}
            placeholder="Selecione o tipo"
            searchPlaceholder="Pesquisar tipo..."
            disabled={readOnly}
          />
        </div>
        <div className="space-y-1.5" {...fieldLayout('material')}>
          <Label htmlFor="material">
            {fieldLabel('material', 'Material')} <FieldAsterisk type={getAsterisk('material')} />
          </Label>
          <SearchableSelect
            options={materiais.map((item) => ({ value: item.id, label: item.nome }))}
            value={formData.materialId || ''}
            onValueChange={(value) => {
              const selected = materiais.find((item) => item.id === value);
              setFormData((prev) => ({
                ...prev,
                materialId: value,
                material: selected?.nome || '',
              }));
            }}
            placeholder="Selecione o material"
            searchPlaceholder="Pesquisar material..."
            disabled={readOnly}
          />
        </div>
        <div className="space-y-1.5" {...fieldLayout('tamanhoPeca')}>
          <Label htmlFor="tamanhoPeca">
            {fieldLabel('tamanhoPeca', 'Tamanho da Peça')}{' '}
            <FieldAsterisk type={getAsterisk('tamanhoPeca')} />
          </Label>
          <Input
            id="tamanhoPeca"
            value={formData.tamanhoPeca}
            disabled={readOnly}
            onChange={(e) => handleChange('tamanhoPeca', e.target.value)}
            placeholder="P, M, G, GG, 38, 40..."
          />
        </div>

        <div className="space-y-1.5" {...fieldLayout('corPredominante')}>
          <Label>
            {fieldLabel('corPredominante', 'Cor Predominante')}{' '}
            <FieldAsterisk type={getAsterisk('corPredominante')} />
          </Label>
          <ColorPicker
            value={formData.corPredominante}
            onChange={(cor) => handleChange('corPredominante', cor)}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-1.5" {...fieldLayout('corSecundaria')}>
          <Label>
            {fieldLabel('corSecundaria', 'Cor Secundária')}{' '}
            <FieldAsterisk type={getAsterisk('corSecundaria')} />
          </Label>
          <ColorPicker
            value={formData.corSecundaria}
            onChange={(cor) => handleChange('corSecundaria', cor)}
            disabled={readOnly}
          />
        </div>
      </ConfigurableFieldGrid>

      <div className="space-y-2">
        <Label>Imagens</Label>
        <div className="border rounded-lg p-4 space-y-4">
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Imagens
              </Button>
            </div>
          )}
          {imagens.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {imagens.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt="Figurino"
                    className={`w-full h-24 object-cover rounded-lg border-2 ${img.isPrincipal ? 'border-primary' : 'border-transparent'}`}
                  />
                  {!readOnly && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:text-yellow-400"
                        onClick={() => handleSetPrincipal(img.id)}
                        title="Definir como principal"
                      >
                        <Star
                          className={`h-4 w-4 ${img.isPrincipal ? 'fill-yellow-400 text-yellow-400' : ''}`}
                        />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:text-red-400"
                        onClick={() => handleRemoveImagem(img.id)}
                        title="Remover imagem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {img.isPrincipal && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                      Principal
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <div>
            <span className="font-medium">Data de Cadastro:</span>{' '}
            {data.dataCadastro ? new Date(data.dataCadastro).toLocaleDateString('pt-BR') : '-'}
          </div>
          <div>
            <span className="font-medium">Usuário:</span> {data.usuarioCadastro}
          </div>
        </div>
      )}
    </form>
  );
};

export default FigurinoFormBody;
