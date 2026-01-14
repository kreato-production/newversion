import { useState, useEffect, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import type { RecursoHumano, Anexo } from '@/pages/recursos/RecursosHumanos';
import { Upload, X, User, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface RecursoHumanoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecursoHumano) => void;
  data?: RecursoHumano | null;
}

export const RecursoHumanoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: RecursoHumanoFormModalProps) => {
  const { user } = useAuth();
  const [departamentos, setDepartamentos] = useState<{ id: string; nome: string }[]>([]);
  const [cargos, setCargos] = useState<{ id: string; nome: string }[]>([]);
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const anexoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    sobrenome: '',
    foto: '',
    dataNascimento: '',
    sexo: '',
    telefone: '',
    email: '',
    departamento: '',
    cargo: '',
    custoHora: 0,
    dataContratacao: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });

  const [anexos, setAnexos] = useState<Anexo[]>([]);

  useEffect(() => {
    const storedDep = localStorage.getItem('kreato_departamentos');
    const storedCargos = localStorage.getItem('kreato_cargos');
    setDepartamentos(storedDep ? JSON.parse(storedDep) : []);
    setCargos(storedCargos ? JSON.parse(storedCargos) : []);
  }, [isOpen]);

  useEffect(() => {
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        sobrenome: data.sobrenome,
        foto: data.foto || '',
        dataNascimento: data.dataNascimento,
        sexo: data.sexo,
        telefone: data.telefone,
        email: data.email,
        departamento: data.departamento,
        cargo: data.cargo,
        custoHora: data.custoHora,
        dataContratacao: data.dataContratacao,
        status: data.status,
      });
      setAnexos(data.anexos || []);
    } else {
      setFormData({
        codigoExterno: '',
        nome: '',
        sobrenome: '',
        foto: '',
        dataNascimento: '',
        sexo: '',
        telefone: '',
        email: '',
        departamento: '',
        cargo: '',
        custoHora: 0,
        dataContratacao: '',
        status: 'Ativo',
      });
      setAnexos([]);
    }
  }, [data, isOpen]);

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem (PNG ou JPG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A foto deve ter no máximo 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, foto: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAnexoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name}: O arquivo deve ter no máximo 2MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const novoAnexo: Anexo = {
          id: crypto.randomUUID(),
          nome: file.name,
          tipo: file.type,
          tamanho: file.size,
          dataUrl: event.target?.result as string,
        };
        setAnexos((prev) => [...prev, novoAnexo]);
      };
      reader.readAsDataURL(file);
    });

    if (anexoInputRef.current) {
      anexoInputRef.current.value = '';
    }
  };

  const handleRemoveAnexo = (id: string) => {
    setAnexos((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      anexos,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do colaborador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Foto e Dados Básicos */}
          <div className="flex gap-6">
            {/* Upload de Foto */}
            <div className="flex flex-col items-center gap-2">
              <Label>Foto</Label>
              <div
                className="w-28 h-28 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
                onClick={() => fotoInputRef.current?.click()}
              >
                {formData.foto ? (
                  <img src={formData.foto} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground/50" />
                )}
              </div>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleFotoUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => fotoInputRef.current?.click()}
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </Button>
              {formData.foto && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive"
                  onClick={() => setFormData({ ...formData, foto: '' })}
                >
                  Remover
                </Button>
              )}
            </div>

            {/* Campos principais */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome *</Label>
                  <Input
                    id="sobrenome"
                    value={formData.sobrenome}
                    onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select
                    value={formData.sexo}
                    onValueChange={(value) => setFormData({ ...formData, sexo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataContratacao">Data de Contratação</Label>
              <Input
                id="dataContratacao"
                type="date"
                value={formData.dataContratacao}
                onChange={(e) => setFormData({ ...formData, dataContratacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custoHora">Custo/Hora (R$)</Label>
              <Input
                id="custoHora"
                type="number"
                step="0.01"
                min="0"
                value={formData.custoHora}
                onChange={(e) => setFormData({ ...formData, custoHora: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={formData.departamento}
                onValueChange={(value) => setFormData({ ...formData, departamento: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((d) => (
                    <SelectItem key={d.id} value={d.nome}>{d.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={formData.cargo}
                onValueChange={(value) => setFormData({ ...formData, cargo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as 'Ativo' | 'Inativo' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Anexos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Anexos (máx. 2MB por arquivo)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => anexoInputRef.current?.click()}
              >
                <Upload className="w-3 h-3 mr-1" />
                Adicionar Anexo
              </Button>
            </div>
            <input
              ref={anexoInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAnexoUpload}
            />
            
            {anexos.length > 0 ? (
              <div className="border rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                {anexos.map((anexo) => (
                  <div key={anexo.id} className="flex items-center justify-between text-sm bg-muted/30 rounded p-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{anexo.nome}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({formatFileSize(anexo.tamanho)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => handleRemoveAnexo(anexo.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground border-dashed">
                Nenhum anexo adicionado
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary hover:opacity-90">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
