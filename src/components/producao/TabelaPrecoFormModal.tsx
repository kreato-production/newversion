import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TabelaPrecoRecursosTecnicosTab } from '@/components/producao/TabelaPrecoRecursosTecnicosTab';
import { TabelaPrecoRecursosFisicosTab } from '@/components/producao/TabelaPrecoRecursosFisicosTab';
import type { TabelaPrecoItem } from '@/pages/producao/TabelasPreco';

interface UnidadeNegocioOption {
  id: string;
  nome: string;
  moeda: string;
}

interface TabelaPrecoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  data?: TabelaPrecoItem | null;
  readOnly?: boolean;
}

export const TabelaPrecoFormModal = ({ isOpen, onClose, onSave, data, readOnly = false }: TabelaPrecoFormModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [unidades, setUnidades] = useState<UnidadeNegocioOption[]>([]);
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    status: 'Ativo',
    vigenciaInicio: '',
    vigenciaFim: '',
    descricao: '',
    unidadeNegocioId: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchUnidades();
      if (data) {
        setFormData({
          codigoExterno: data.codigoExterno || '',
          nome: data.nome || '',
          status: data.status || 'Ativo',
          vigenciaInicio: data.vigenciaInicio || '',
          vigenciaFim: data.vigenciaFim || '',
          descricao: data.descricao || '',
          unidadeNegocioId: data.unidadeNegocioId || '',
        });
        setSavedId(data.id);
      } else {
        setFormData({ codigoExterno: '', nome: '', status: 'Ativo', vigenciaInicio: '', vigenciaFim: '', descricao: '', unidadeNegocioId: '' });
        setSavedId(null);
      }
    }
  }, [data, isOpen]);

  const fetchUnidades = async () => {
    const { data: un } = await supabase.from('unidades_negocio').select('id, nome, moeda').order('nome');
    setUnidades((un || []).map((u: any) => ({ id: u.id, nome: u.nome, moeda: u.moeda || 'BRL' })));
  };

  const selectedMoeda = unidades.find(u => u.id === formData.unidadeNegocioId)?.moeda || 'BRL';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dbData: any = {
        codigo_externo: formData.codigoExterno || null,
        nome: formData.nome,
        status: formData.status,
        vigencia_inicio: formData.vigenciaInicio || null,
        vigencia_fim: formData.vigenciaFim || null,
        descricao: formData.descricao || null,
        unidade_negocio_id: formData.unidadeNegocioId || null,
      };

      if (data) {
        const { error } = await supabase.from('tabelas_preco' as any).update(dbData).eq('id', data.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Tabela de preço atualizada!' });
      } else {
        dbData.created_by = user?.id || null;
        const { data: inserted, error } = await supabase.from('tabelas_preco' as any).insert(dbData).select().single();
        if (error) throw error;
        setSavedId((inserted as any).id);
        toast({ title: 'Sucesso', description: 'Tabela de preço cadastrada!' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving tabela_preco:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar tabela de preço', variant: 'destructive' });
    }
  };

  const currentId = data?.id || savedId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Tabela de Preço' : 'Nova Tabela de Preço'}</DialogTitle>
          <DialogDescription>Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} a tabela de preço.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">Código Externo</Label>
              <Input id="codigoExterno" value={formData.codigoExterno} onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })} maxLength={10} placeholder="Máx. 10 caracteres" disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
              <Input id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} maxLength={100} required disabled={readOnly} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unidadeNegocio">Unidade de Negócio</Label>
              <Select value={formData.unidadeNegocioId} onValueChange={(v) => setFormData({ ...formData, unidadeNegocioId: v })} disabled={readOnly}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {unidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vigenciaInicio">Vigência De</Label>
              <Input id="vigenciaInicio" type="date" value={formData.vigenciaInicio} onChange={(e) => setFormData({ ...formData, vigenciaInicio: e.target.value })} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vigenciaFim">Vigência Até</Label>
              <Input id="vigenciaFim" type="date" value={formData.vigenciaFim} onChange={(e) => setFormData({ ...formData, vigenciaFim: e.target.value })} disabled={readOnly} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} rows={3} placeholder="Descrição da tabela de preço..." disabled={readOnly} />
          </div>

          {data?.usuarioCadastro && (
            <div className="space-y-2">
              <Label>Usuário de Cadastro</Label>
              <Input value={data.usuarioCadastro} disabled />
            </div>
          )}

          {currentId && (
            <Tabs defaultValue="recursosTecnicos" className="w-full">
              <TabsList>
                <TabsTrigger value="recursosTecnicos">Recursos Técnicos</TabsTrigger>
                <TabsTrigger value="recursosFisicos">Recursos Físicos</TabsTrigger>
              </TabsList>
              <TabsContent value="recursosTecnicos">
                <TabelaPrecoRecursosTecnicosTab tabelaPrecoId={currentId} readOnly={readOnly} moeda={selectedMoeda} />
              </TabsContent>
              <TabsContent value="recursosFisicos">
                <TabelaPrecoRecursosFisicosTab tabelaPrecoId={currentId} readOnly={readOnly} moeda={selectedMoeda} />
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{readOnly ? 'Fechar' : 'Cancelar'}</Button>
            {!readOnly && <Button type="submit" className="gradient-primary hover:opacity-90">Salvar</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TabelaPrecoFormModal;
