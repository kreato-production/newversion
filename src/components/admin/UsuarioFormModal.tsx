import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import type { Usuario } from '@/pages/admin/Usuarios';
import { UnidadesNegocioTab } from './UnidadesNegocioTab';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Usuario) => void;
  data?: Usuario | null;
}

export const UsuarioFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: UsuarioFormModalProps) => {
  const { user, session } = useAuth();
  const [perfis, setPerfis] = useState<{ id: string; nome: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    email: '',
    usuario: '',
    senha: '',
    foto: '',
    perfil: '',
    perfilId: '',
    descricao: '',
  });

  // Fetch perfis from Supabase
  const fetchPerfis = useCallback(async () => {
    if (!session) return;
    
    try {
      const { data: perfisData, error } = await supabase
        .from('perfis_acesso')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      setPerfis(perfisData || []);
    } catch (err) {
      console.error('Error fetching perfis:', err);
    }
  }, [session]);

  useEffect(() => {
    if (isOpen) {
      fetchPerfis();
    }
  }, [isOpen, fetchPerfis]);

  useEffect(() => {
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        email: data.email,
        usuario: data.usuario,
        senha: data.senha || '',
        foto: data.foto || '',
        perfil: data.perfil,
        perfilId: data.perfilId || '',
        descricao: data.descricao,
      });
      setFotoPreview(data.foto || null);
    } else {
      setFormData({
        codigoExterno: '',
        nome: '',
        email: '',
        usuario: '',
        senha: '',
        foto: '',
        perfil: '',
        perfilId: '',
        descricao: '',
      });
      setFotoPreview(null);
    }
  }, [data, isOpen]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFotoPreview(base64);
        setFormData({ ...formData, foto: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFoto = () => {
    setFotoPreview(null);
    setFormData({ ...formData, foto: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios para novos usuários
    if (!data) {
      if (!formData.email || !formData.senha || !formData.nome || !formData.usuario) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }
    }
    
    const saveData = {
      id: data?.id || crypto.randomUUID(),
      ...formData,
      perfilId: formData.perfilId || undefined,
      // Manter senha atual se estiver editando e não preencheu nova senha
      senha: formData.senha || data?.senha || '',
      foto: formData.foto || data?.foto || '',
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    };
    onSave(saveData);
    // Não fechar modal aqui - o Usuarios.tsx vai fechar após o sucesso
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do usuário.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="unidades" disabled={!data}>Unidades de Negócio</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Foto do usuário */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    <AvatarImage src={fotoPreview || undefined} alt={formData.nome} />
                    <AvatarFallback className="text-lg bg-muted">
                      {formData.nome ? getInitials(formData.nome) : <Camera className="h-6 w-6 text-muted-foreground" />}
                    </AvatarFallback>
                  </Avatar>
                  {fotoPreview && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                      onClick={handleRemoveFoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Foto do Usuário</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {fotoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. Máximo 2MB.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleFotoChange}
                  />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuário <span className="text-destructive">*</span></Label>
                  <Input
                    id="usuario"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha <span className="text-destructive">*</span></Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  maxLength={50}
                  required={!data}
                  placeholder={data ? '••••••••' : ''}
                />
                {data && (
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para manter a senha atual
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Perfil de Acesso</Label>
                <Select
                  value={formData.perfilId}
                  onValueChange={(value) => {
                    const perfilSelecionado = perfis.find(p => p.id === value);
                    setFormData({ 
                      ...formData, 
                      perfilId: value,
                      perfil: perfilSelecionado?.nome || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                />
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
          </TabsContent>

          <TabsContent value="unidades">
            {data && <UnidadesNegocioTab usuarioId={data.id} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};