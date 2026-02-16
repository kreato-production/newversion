import { useState, useEffect, useCallback, useMemo } from 'react';
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

interface Servico {
  id: string;
  nome: string;
}

interface ConteudoTerceiro {
  id: string;
  servicoId: string;
  servicoNome: string;
  valorPrevisto: number;
}

interface ConteudoTerceirosTabProps {
  conteudoId: string;
  moeda?: string;
  readOnly?: boolean;
}

export const ConteudoTerceirosTab = ({ conteudoId, moeda = 'BRL', readOnly = false }: ConteudoTerceirosTabProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [terceiros, setTerceiros] = useState<ConteudoTerceiro[]>([]);
  const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedServicoId, setSelectedServicoId] = useState('');
  const [valorPrevisto, setValorPrevisto] = useState('');

  const formatCurrency = useCallback((value: number) => {
    return formatCurrencyUtil(value, moeda);
  }, [moeda]);

  const fetchData = useCallback(async () => {
    if (!session) return;

    try {
      // Fetch conteudo_terceiros
      const { data: ctData } = await (supabase as any)
        .from('conteudo_terceiros')
        .select('id, servico_id, valor_previsto, servicos:servico_id(id, nome)')
        .eq('conteudo_id', conteudoId);

      setTerceiros((ctData || []).map((ct: any) => ({
        id: ct.id,
        servicoId: ct.servico_id,
        servicoNome: ct.servicos?.nome || '',
        valorPrevisto: Number(ct.valor_previsto) || 0,
      })));

      // Fetch all services
      const { data: servicosData } = await supabase
        .from('servicos')
        .select('id, nome')
        .order('nome');

      setServicosDisponiveis(servicosData || []);
    } catch (err) {
      console.error('Error fetching conteudo terceiros:', err);
    }
  }, [session, conteudoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const servicosNaoSelecionados = servicosDisponiveis.filter(
    (s) => !terceiros.some((t) => t.servicoId === s.id)
  );

  const handleAdd = async () => {
    if (!selectedServicoId) return;

    const valor = parseFloat(valorPrevisto.replace(',', '.')) || 0;
    const servico = servicosDisponiveis.find(s => s.id === selectedServicoId);
    if (!servico) return;

    const { data: inserted, error } = await (supabase as any)
      .from('conteudo_terceiros')
      .insert({
        conteudo_id: conteudoId,
        servico_id: selectedServicoId,
        valor_previsto: valor,
        created_by: session?.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao adicionar serviço.', variant: 'destructive' });
      return;
    }

    setTerceiros([...terceiros, {
      id: inserted.id,
      servicoId: selectedServicoId,
      servicoNome: servico.nome,
      valorPrevisto: valor,
    }]);

    setSelectedServicoId('');
    setValorPrevisto('');
    setIsAdding(false);
    toast({ title: 'Serviço adicionado', description: `${servico.nome} foi adicionado.` });
  };

  const handleRemove = async (id: string) => {
    const { error } = await (supabase as any)
      .from('conteudo_terceiros')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao remover serviço.', variant: 'destructive' });
      return;
    }

    setTerceiros(terceiros.filter(t => t.id !== id));
    toast({ title: 'Serviço removido', description: 'O serviço foi removido.' });
  };

  const handleUpdateValor = async (id: string, novoValor: string) => {
    const valor = parseFloat(novoValor.replace(',', '.')) || 0;

    const { error } = await (supabase as any)
      .from('conteudo_terceiros')
      .update({ valor_previsto: valor })
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar valor.', variant: 'destructive' });
      return;
    }

    setTerceiros(terceiros.map(t => t.id === id ? { ...t, valorPrevisto: valor } : t));
  };

  const totalPrevisto = useMemo(() => {
    return terceiros.reduce((acc, t) => acc + t.valorPrevisto, 0);
  }, [terceiros]);

  return (
    <div className="space-y-6 py-4">
      {/* Add button */}
      {!readOnly && (
        <div className="flex justify-end">
          {!isAdding ? (
            <Button onClick={() => setIsAdding(true)} className="gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>
          ) : (
            <div className="w-full p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Serviço</Label>
                  <Select value={selectedServicoId} onValueChange={setSelectedServicoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço..." />
                    </SelectTrigger>
                    <SelectContent>
                      {servicosNaoSelecionados.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Previsto</Label>
                  <Input
                    type="text"
                    value={valorPrevisto}
                    onChange={(e) => setValorPrevisto(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd} disabled={!selectedServicoId} className="gradient-primary hover:opacity-90">
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => { setIsAdding(false); setSelectedServicoId(''); setValorPrevisto(''); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {terceiros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum serviço de terceiro adicionado</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Adicione serviços de terceiros com valor previsto para este conteúdo.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Serviços de Terceiros
              <Badge variant="secondary" className="ml-2">
                {terceiros.length} item(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right w-[200px]">Valor Previsto</TableHead>
                  {!readOnly && <TableHead className="w-[80px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {terceiros.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.servicoNome}</TableCell>
                    <TableCell className="text-right">
                      {readOnly ? (
                        formatCurrency(t.valorPrevisto)
                      ) : (
                        <Input
                          type="text"
                          className="text-right w-[150px] ml-auto"
                          defaultValue={t.valorPrevisto.toString()}
                          onBlur={(e) => handleUpdateValor(t.id, e.target.value)}
                        />
                      )}
                    </TableCell>
                    {!readOnly && (
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
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalPrevisto)}</TableCell>
                  {!readOnly && <TableCell></TableCell>}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary card */}
      {terceiros.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Previsto com Terceiros</p>
                  <p className="text-sm text-muted-foreground">{terceiros.length} serviço(s)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalPrevisto)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
