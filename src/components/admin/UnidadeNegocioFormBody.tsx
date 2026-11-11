import { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import {
  FieldAsterisk,
  useFormFieldConfig,
  ConfigurableFieldGrid,
} from '@/hooks/useFormFieldConfig';
import type { RecordFormBodyProps } from '@/components/shared/RecordFormPage';
import { CURRENCIES } from '@/lib/currencies';
import type { UnidadeNegocio } from '@/modules/unidades/unidades.types';
import { unidadesRepository } from '@/modules/unidades/unidades.repository.provider';

const emptyFormData = {
  codigoExterno: '',
  nome: '',
  descricao: '',
  imagem: '',
  moeda: 'BRL',
};

function toFormData(data: UnidadeNegocio | null) {
  return data
    ? {
        codigoExterno: data.codigoExterno || '',
        nome: data.nome || '',
        descricao: data.descricao || '',
        imagem: data.imagem || '',
        moeda: data.moeda || 'BRL',
      }
    : { ...emptyFormData };
}

/**
 * Fields of the Unidade de Negócio cadastro. Rendered by the form page and, inside a
 * dialog, by `UnidadeNegocioFormModal` (Tenant > Unidades tab).
 */
export const UnidadeNegocioFormBody = ({
  formId,
  data,
  readOnly,
  onSubmit,
}: RecordFormBodyProps<UnidadeNegocio, UnidadeNegocio>) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState(() => toFormData(data));
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('unidadeNegocio');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no maximo 2MB.');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, imagem: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imagem: '' });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly || isSaving) return;
    const camposValidos = validate({
      codigoExterno: formData.codigoExterno,
      nome: formData.nome,
      moeda: formData.moeda,
      descricao: formData.descricao,
    });
    if (!camposValidos) return;
    setIsSaving(true);

    try {
      const unidadeId = data?.id;
      let imagemUrl = formData.imagem;

      if (selectedFile && unidadeId) {
        const uploadedUrl = await unidadesRepository.uploadLogo(selectedFile, unidadeId);
        if (uploadedUrl) {
          imagemUrl = uploadedUrl;
        }
      } else if (!formData.imagem) {
        imagemUrl = '';
      }

      await onSubmit({
        id: unidadeId || '',
        codigoExterno: formData.codigoExterno,
        nome: formData.nome,
        descricao: formData.descricao,
        imagem: imagemUrl,
        moeda: formData.moeda,
        dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
        usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
      });
    } catch (error) {
      console.error('Error saving unidade:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <Tabs defaultValue="dados" className="w-full">
        <TabsList>
          <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
          <TabsTrigger value="preferencias">Preferencias</TabsTrigger>
        </TabsList>

        {/* Kept mounted so required fields are validated when saving from another tab. */}
        <TabsContent value="dados" forceMount className="data-[state=inactive]:hidden">
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Logotipo</Label>
              <div className="flex items-start gap-4">
                <div className="relative">
                  {formData.imagem ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={formData.imagem}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Clique para</span>
                      <span className="text-xs text-muted-foreground">adicionar</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {formData.imagem ? 'Alterar' : 'Upload'}
                  </Button>
                  <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, GIF. Max: 2MB</p>
                </div>
              </div>
            </div>

            <ConfigurableFieldGrid>
              <div className="space-y-1.5" {...fieldLayout('codigoExterno')}>
                <Label htmlFor="codigoExterno">
                  {fieldLabel('codigoExterno', 'Codigo Externo')}{' '}
                  <FieldAsterisk type={getAsterisk('codigoExterno')} />
                </Label>
                <Input
                  id="codigoExterno"
                  value={formData.codigoExterno}
                  onChange={(event) =>
                    setFormData({ ...formData, codigoExterno: event.target.value })
                  }
                  maxLength={10}
                  placeholder="Max. 10 caracteres"
                />
              </div>
              <div className="space-y-1.5" {...fieldLayout('nome')}>
                <Label htmlFor="nome">
                  {fieldLabel('nome', 'Nome')} <FieldAsterisk type={getAsterisk('nome', true)} />
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-1.5" {...fieldLayout('descricao')}>
                <Label htmlFor="descricao">
                  {fieldLabel('descricao', 'Descricao')}{' '}
                  <FieldAsterisk type={getAsterisk('descricao')} />
                </Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(event) => setFormData({ ...formData, descricao: event.target.value })}
                  rows={3}
                  placeholder="Descricao da unidade de negocio..."
                />
              </div>
            </ConfigurableFieldGrid>
          </div>
        </TabsContent>

        <TabsContent value="preferencias">
          <div className="space-y-4 mt-4">
            <ConfigurableFieldGrid>
              <div className="space-y-1.5" {...fieldLayout('moeda')}>
                <Label htmlFor="moeda">
                  {fieldLabel('moeda', 'Moeda Padrao')}{' '}
                  <FieldAsterisk type={getAsterisk('moeda')} />
                </Label>
                <Select
                  value={formData.moeda}
                  onValueChange={(value) => setFormData({ ...formData, moeda: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moeda..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Esta moeda sera usada para exibir todos os valores de custos relacionados a esta
                  unidade de negocio.
                </p>
              </div>
            </ConfigurableFieldGrid>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
};

export default UnidadeNegocioFormBody;
