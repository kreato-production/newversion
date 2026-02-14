import { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Building2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencies';

interface Fornecedor {
  id: string;
  nome: string;
  categoria?: string;
}

interface Servico {
  id: string;
  nome: string;
}

interface TerceiroAlocado {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  servicoId: string;
  servicoNome: string;
  custo: number;
}

interface TerceirosTabProps {
  gravacaoId: string;
}

export const TerceirosTab = ({ gravacaoId }: TerceirosTabProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [terceiros, setTerceiros] = useState<TerceiroAlocado[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicosFornecedor, setServicosFornecedor] = useState<Servico[]>([]);
  const [moeda, setMoeda] = useState<string>('BRL');
  
  const [selectedFornecedor, setSelectedFornecedor] = useState('');
  const [selectedServico, setSelectedServico] = useState('');
  const [custo, setCusto] = useState('');
  
  // Custom currency formatter based on business unit
  const formatCurrency = useCallback((value: number) => {
    return formatCurrencyUtil(value, moeda);
  }, [moeda]);

  const fetchData = useCallback(async () => {
    if (!session) return;

    try {
      // First, fetch the gravação to get the unidade_negocio_id
      const { data: gravacaoData } = await supabase
        .from('gravacoes')
        .select('unidade_negocio_id')
        .eq('id', gravacaoId)
        .single();

      // If there's a business unit, fetch its currency preference
      if (gravacaoData?.unidade_negocio_id) {
        const { data: unidadeData } = await supabase
          .from('unidades_negocio')
          .select('moeda')
          .eq('id', gravacaoData.unidade_negocio_id)
          .single();
        
        if (unidadeData?.moeda) {
          setMoeda(unidadeData.moeda);
        }
      }

      // Fetch terceiros alocados from Supabase
      const { data: terceirosData } = await supabase
        .from('gravacao_terceiros')
        .select('*, fornecedores:fornecedor_id(id, nome), fornecedor_servicos:servico_id(id, nome)')
        .eq('gravacao_id', gravacaoId);

      setTerceiros((terceirosData || []).map((t: any) => ({
        id: t.id,
        fornecedorId: t.fornecedor_id,
        fornecedorNome: t.fornecedores?.nome || '',
        servicoId: t.servico_id || '',
        servicoNome: t.fornecedor_servicos?.nome || '',
        custo: t.valor || 0,
      })));

      // Fetch fornecedores
      const { data: fornecedoresData } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .order('nome');

      setFornecedores(fornecedoresData || []);

      // Fetch serviços gerais
      const { data: servicosData } = await supabase
        .from('servicos')
        .select('id, nome')
        .order('nome');

      setServicos(servicosData || []);
    } catch (err) {
      console.error('Error fetching terceiros data:', err);
    }
  }, [session, gravacaoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch serviços do fornecedor selecionado
  useEffect(() => {
    const fetchServicosFornecedor = async () => {
      if (!selectedFornecedor || !session) {
        setServicosFornecedor([]);
        return;
      }

      const { data } = await supabase
        .from('fornecedor_servicos')
        .select('id, nome')
        .eq('fornecedor_id', selectedFornecedor)
        .order('nome');

      setServicosFornecedor(data || []);
    };

    fetchServicosFornecedor();
  }, [selectedFornecedor, session]);

  const handleAdd = async () => {
    if (!selectedFornecedor || !selectedServico) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione o fornecedor e o serviço.',
        variant: 'destructive',
      });
      return;
    }

    const custoNum = parseFloat(custo.replace(',', '.')) || 0;

    const fornecedor = fornecedores.find(f => f.id === selectedFornecedor);
    const servico = servicosFornecedor.find(s => s.id === selectedServico);

    if (!fornecedor || !servico) return;

    // Verificar duplicata
    const exists = terceiros.find(
      t => t.fornecedorId === selectedFornecedor && t.servicoId === selectedServico
    );

    if (exists) {
      toast({
        title: 'Registro duplicado',
        description: 'Este serviço já foi adicionado para este fornecedor.',
        variant: 'destructive',
      });
      return;
    }

    const { data: insertedData, error } = await supabase
      .from('gravacao_terceiros')
      .insert({
        gravacao_id: gravacaoId,
        fornecedor_id: selectedFornecedor,
        servico_id: selectedServico,
        valor: custoNum,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar terceiro.',
        variant: 'destructive',
      });
      return;
    }

    const novo: TerceiroAlocado = {
      id: insertedData.id,
      fornecedorId: selectedFornecedor,
      fornecedorNome: fornecedor.nome,
      servicoId: selectedServico,
      servicoNome: servico.nome,
      custo: custoNum,
    };

    setTerceiros([...terceiros, novo]);

    // Limpar campos
    setSelectedFornecedor('');
    setSelectedServico('');
    setCusto('');

    toast({
      title: 'Terceiro adicionado',
      description: `${fornecedor.nome} - ${servico.nome} foi adicionado.`,
    });
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase
      .from('gravacao_terceiros')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover terceiro.',
        variant: 'destructive',
      });
      return;
    }

    setTerceiros(terceiros.filter(t => t.id !== id));
    toast({
      title: 'Terceiro removido',
      description: 'O serviço terceirizado foi removido.',
    });
  };

  const totalCusto = useMemo(() => {
    return terceiros.reduce((acc, t) => acc + t.custo, 0);
  }, [terceiros]);

  return (
    <div className="space-y-6 py-4">
      {/* Formulário de adição */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Adicionar Serviço Terceirizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select 
                value={selectedServico} 
                onValueChange={setSelectedServico}
                disabled={!selectedFornecedor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço..." />
                </SelectTrigger>
                <SelectContent>
                  {servicosFornecedor.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custo</Label>
              <Input
                type="text"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <Button 
              onClick={handleAdd} 
              className="gradient-primary hover:opacity-90"
              disabled={!selectedFornecedor || !selectedServico}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de terceiros */}
      {terceiros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum terceiro adicionado</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Adicione fornecedores e serviços terceirizados para esta gravação.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Serviços Terceirizados
              <Badge variant="secondary" className="ml-2">
                {terceiros.length} item(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terceiros.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.fornecedorNome}</TableCell>
                    <TableCell>{t.servicoNome}</TableCell>
                    <TableCell className="text-right">{formatCurrency(t.custo)}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={2} className="font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalCusto)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Card de resumo */}
      {terceiros.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Custo Total com Terceiros</p>
                  <p className="text-sm text-muted-foreground">
                    {terceiros.length} serviço(s) contratado(s)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalCusto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
