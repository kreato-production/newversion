import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ServicoParametro {
  id: string;
  nome: string;
  descricao: string | null;
}

interface FornecedorServico {
  id: string;
  servico_id: string;
  nome: string;
  descricao: string | null;
  valor: number | null;
}

interface ServicosTabProps {
  fornecedorId: string;
}

export const ServicosTab = ({ fornecedorId }: ServicosTabProps) => {
  const { toast } = useToast();
  const [servicosDisponiveis, setServicosDisponiveis] = useState<ServicoParametro[]>([]);
  const [fornecedorServicos, setFornecedorServicos] = useState<FornecedorServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [valoresEditados, setValoresEditados] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [servicosRes, fornServRes] = await Promise.all([
        supabase.from('servicos').select('id, nome, descricao').order('nome'),
        supabase
          .from('fornecedor_servicos')
          .select('id, servico_id, nome, descricao, valor')
          .eq('fornecedor_id', fornecedorId)
          .order('nome'),
      ]);

      if (servicosRes.error) throw servicosRes.error;
      if (fornServRes.error) throw fornServRes.error;

      setServicosDisponiveis(servicosRes.data || []);
      setFornecedorServicos(fornServRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
      toast({ title: 'Erro', description: 'Erro ao carregar serviços.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fornecedorId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isServicoSelecionado = (servicoId: string) => {
    return fornecedorServicos.some((fs) => fs.servico_id === servicoId);
  };

  const getFornecedorServico = (servicoId: string) => {
    return fornecedorServicos.find((fs) => fs.servico_id === servicoId);
  };

  const handleToggleServico = async (servico: ServicoParametro, checked: boolean) => {
    if (checked) {
      try {
        const { data, error } = await supabase
          .from('fornecedor_servicos')
          .insert({
            fornecedor_id: fornecedorId,
            servico_id: servico.id,
            nome: servico.nome,
            descricao: servico.descricao,
            valor: null,
          })
          .select()
          .single();

        if (error) throw error;
        setFornecedorServicos((prev) => [...prev, data]);
        toast({ title: 'Sucesso', description: `Serviço "${servico.nome}" adicionado.` });
      } catch (err) {
        console.error('Erro ao adicionar serviço:', err);
        toast({ title: 'Erro', description: 'Erro ao adicionar serviço.', variant: 'destructive' });
      }
    } else {
      const fs = getFornecedorServico(servico.id);
      if (!fs) return;

      try {
        const { error } = await supabase
          .from('fornecedor_servicos')
          .delete()
          .eq('id', fs.id);

        if (error) throw error;
        setFornecedorServicos((prev) => prev.filter((s) => s.id !== fs.id));
        toast({ title: 'Removido', description: `Serviço "${servico.nome}" removido.` });
      } catch (err) {
        console.error('Erro ao remover serviço:', err);
        toast({ title: 'Erro', description: 'Erro ao remover serviço.', variant: 'destructive' });
      }
    }
  };

  const handleValorChange = (servicoId: string, valor: string) => {
    setValoresEditados((prev) => ({ ...prev, [servicoId]: valor }));
  };

  const handleValorBlur = async (servicoId: string) => {
    const fs = getFornecedorServico(servicoId);
    if (!fs) return;

    const novoValor = valoresEditados[servicoId];
    if (novoValor === undefined) return;

    const valorNumerico = novoValor ? parseFloat(novoValor) : null;

    try {
      const { error } = await supabase
        .from('fornecedor_servicos')
        .update({ valor: valorNumerico })
        .eq('id', fs.id);

      if (error) throw error;
      setFornecedorServicos((prev) =>
        prev.map((s) => (s.id === fs.id ? { ...s, valor: valorNumerico } : s))
      );
      setValoresEditados((prev) => {
        const copy = { ...prev };
        delete copy[servicoId];
        return copy;
      });
    } catch (err) {
      console.error('Erro ao atualizar valor:', err);
      toast({ title: 'Erro', description: 'Erro ao atualizar valor.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-semibold">Serviços do Fornecedor</h3>

      {servicosDisponiveis.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right w-40">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicosDisponiveis.map((servico) => {
              const selecionado = isServicoSelecionado(servico.id);
              const fs = getFornecedorServico(servico.id);
              const valorDisplay =
                valoresEditados[servico.id] !== undefined
                  ? valoresEditados[servico.id]
                  : fs?.valor?.toString() ?? '';

              return (
                <TableRow key={servico.id}>
                  <TableCell>
                    <Checkbox
                      checked={selecionado}
                      onCheckedChange={(checked) =>
                        handleToggleServico(servico, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{servico.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {servico.descricao || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {selecionado ? (
                      <Input
                        type="number"
                        step="0.01"
                        className="w-32 ml-auto text-right"
                        value={valorDisplay}
                        onChange={(e) => handleValorChange(servico.id, e.target.value)}
                        onBlur={() => handleValorBlur(servico.id)}
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum serviço cadastrado no sistema.</p>
          <p className="text-sm">Cadastre serviços em Recursos &gt; Parametrizações &gt; Serviços.</p>
        </div>
      )}
    </div>
  );
};
