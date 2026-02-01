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
import type { Fornecedor } from '@/pages/recursos/Fornecedores';
import { ServicosTab } from './ServicosTab';
import { FornecedorArquivosTab } from './FornecedorArquivosTab';
import { supabase } from '@/integrations/supabase/client';

const PAISES = [
  'Brasil', 'Portugal', 'Espanha', 'Estados Unidos', 'Argentina', 'Chile',
  'Colômbia', 'México', 'Peru', 'Uruguai', 'Alemanha', 'França', 'Itália',
  'Reino Unido', 'Canadá', 'Austrália', 'Japão', 'China', 'Índia',
];

interface FornecedorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Fornecedor) => void;
  data?: Fornecedor | null;
}

export const FornecedorFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: FornecedorFormModalProps) => {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);

  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    categoria: '',
    email: '',
    pais: '',
    identificacaoFiscal: '',
    descricao: '',
  });

  useEffect(() => {
    const fetchCategorias = async () => {
      const { data: cats } = await supabase
        .from('categorias_fornecedor')
        .select('id, nome')
        .order('nome');
      setCategorias(cats || []);
    };
    if (isOpen) fetchCategorias();
  }, [isOpen]);

  useEffect(() => {
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        categoria: data.categoria,
        email: data.email,
        pais: data.pais,
        identificacaoFiscal: data.identificacaoFiscal,
        descricao: data.descricao,
      });
    } else {
      setFormData({
        codigoExterno: '',
        nome: '',
        categoria: '',
        email: '',
        pais: '',
        identificacaoFiscal: '',
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
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          <DialogDescription>
            Preencha os dados do fornecedor.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="servicos" disabled={!data}>Serviços</TabsTrigger>
            <TabsTrigger value="arquivos" disabled={!data}>Arquivos</TabsTrigger>
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
                  <Label>Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>País</Label>
                  <Select
                    value={formData.pais}
                    onValueChange={(value) => setFormData({ ...formData, pais: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PAISES.map((pais) => (
                        <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identificacaoFiscal">Identificação Fiscal</Label>
                  <Input
                    id="identificacaoFiscal"
                    value={formData.identificacaoFiscal}
                    onChange={(e) => setFormData({ ...formData, identificacaoFiscal: e.target.value })}
                    maxLength={100}
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

          <TabsContent value="servicos">
            {data && <ServicosTab fornecedorId={data.id} />}
          </TabsContent>

          <TabsContent value="arquivos">
            {data && <FornecedorArquivosTab fornecedorId={data.id} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
