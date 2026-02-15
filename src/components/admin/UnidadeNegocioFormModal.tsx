import { useState, useEffect, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { UnidadeNegocio } from '@/pages/admin/UnidadesNegocio';
import { supabase } from '@/integrations/supabase/client';
import { CURRENCIES } from '@/lib/currencies';

interface UnidadeNegocioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UnidadeNegocio) => Promise<void>;
  data?: UnidadeNegocio | null;
  readOnly?: boolean;
}

const emptyFormData = {
  codigoExterno: '',
  nome: '',
  descricao: '',
  imagem: '',
  moeda: 'BRL',
};

export const UnidadeNegocioFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
}: UnidadeNegocioFormModalProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState(emptyFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(data ? {
        codigoExterno: data.codigoExterno || '',
        nome: data.nome || '',
        descricao: data.descricao || '',
        imagem: data.imagem || '',
        moeda: data.moeda || 'BRL',
      } : { ...emptyFormData });
      setSelectedFile(null);
    }
  }, [isOpen, data]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    // Store file for later upload
    setSelectedFile(file);
    
    // Create local preview
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

  const uploadImage = async (file: File, unidadeId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${unidadeId}.${fileExt}`;

    // Delete existing file if any (ignore errors)
    await supabase.storage.from('unidades-negocio').remove([filePath]);

    const { error } = await supabase.storage
      .from('unidades-negocio')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('unidades-negocio')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const unidadeId = data?.id || crypto.randomUUID();
      let imagemUrl = formData.imagem;

      // If there's a new file to upload
      if (selectedFile) {
        setIsUploading(true);
        const uploadedUrl = await uploadImage(selectedFile, unidadeId);
        if (uploadedUrl) {
          imagemUrl = uploadedUrl;
        }
        setIsUploading(false);
      } else if (!formData.imagem) {
        // Image was removed
        imagemUrl = '';
      }

      await onSave({
        id: unidadeId,
        codigoExterno: formData.codigoExterno,
        nome: formData.nome,
        descricao: formData.descricao,
        imagem: imagemUrl,
        moeda: formData.moeda,
        dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
        usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
      });
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Unidade de Negócio' : 'Nova Unidade de Negócio'}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} a unidade de negócio.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Upload de Imagem */}
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
                    <p className="text-xs text-muted-foreground">
                      Formatos: JPG, PNG, GIF. Máx: 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    maxLength={10}
                    placeholder="Máx. 10 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  placeholder="Descrição da unidade de negócio..."
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                  {readOnly ? 'Fechar' : 'Cancelar'}
                </Button>
                {!readOnly && (
                  <Button type="submit" className="gradient-primary hover:opacity-90" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isUploading ? 'Enviando imagem...' : 'Salvando...'}
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="preferencias">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="moeda">Moeda Padrão</Label>
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
                  Esta moeda será usada para exibir todos os valores de custos relacionados a esta unidade de negócio.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary hover:opacity-90" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UnidadeNegocioFormModal;
