import { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const [perfis, setPerfis] = useState<{ id: string; nome: string }[]>([]);

  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    email: '',
    usuario: '',
    perfil: '',
    descricao: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('kreato_perfis_acesso');
    setPerfis(stored ? JSON.parse(stored) : []);
  }, [isOpen]);

  useEffect(() => {
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        email: data.email,
        usuario: data.usuario,
        perfil: data.perfil,
        descricao: data.descricao,
      });
    } else {
      setFormData({
        codigoExterno: '',
        nome: '',
        email: '',
        usuario: '',
        perfil: '',
        descricao: '',
      });
    }
  }, [data, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: data?.id || crypto.randomUUID(),
      ...formData,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <Label htmlFor="nome">Nome *</Label>
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
                  <Label htmlFor="usuario">Usuário *</Label>
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
                <Label>Perfil de Acesso</Label>
                <Select
                  value={formData.perfil}
                  onValueChange={(value) => setFormData({ ...formData, perfil: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((p) => (
                      <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
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
