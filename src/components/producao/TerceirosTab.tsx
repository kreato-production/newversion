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
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencies';
import {
  gravacoesRelacionamentosApi,
  type GravacaoTerceiroFornecedor,
  type GravacaoTerceiroItem,
  type GravacaoTerceiroServico,
} from '@/modules/gravacoes/gravacoes-relacionamentos.api';

interface TerceirosTabProps {
  gravacaoId: string;
}

export const TerceirosTab = ({ gravacaoId }: TerceirosTabProps) => {
  const { toast } = useToast();
  const [terceiros, setTerceiros] = useState<GravacaoTerceiroItem[]>([]);
  const [fornecedores, setFornecedores] = useState<GravacaoTerceiroFornecedor[]>([]);
  const [servicos, setServicos] = useState<GravacaoTerceiroServico[]>([]);
  const [moeda, setMoeda] = useState('BRL');

  const [selectedFornecedor, setSelectedFornecedor] = useState('');
  const [selectedServico, setSelectedServico] = useState('');
  const [custo, setCusto] = useState('');

  const formatCurrency = useCallback((value: number) => formatCurrencyUtil(value, moeda), [moeda]);

  const fetchData = useCallback(async () => {
    try {
      const response = await gravacoesRelacionamentosApi.listTerceiros(gravacaoId);
      setTerceiros(response.items);
      setFornecedores(response.fornecedores);
      setServicos(response.servicos);
      setMoeda(response.moeda || 'BRL');
    } catch (error) {
      console.error('Error fetching terceiros data from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar terceiros: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  }, [gravacaoId, toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const servicosFornecedor = useMemo(
    () => servicos.filter((item) => item.fornecedorId === selectedFornecedor),
    [selectedFornecedor, servicos],
  );

  const handleAdd = async () => {
    if (!selectedFornecedor || !selectedServico) {
      toast({
        title: 'Campos obrigatorios',
        description: 'Selecione o fornecedor e o servico.',
        variant: 'destructive',
      });
      return;
    }

    const custoNum = Number.parseFloat(custo.replace(',', '.')) || 0;
    const fornecedor = fornecedores.find((item) => item.id === selectedFornecedor);
    const servico = servicosFornecedor.find((item) => item.id === selectedServico);

    if (!fornecedor || !servico) {
      return;
    }

    const exists = terceiros.find(
      (item) => item.fornecedorId === selectedFornecedor && item.servicoId === selectedServico,
    );

    if (exists) {
      toast({
        title: 'Registro duplicado',
        description: 'Este servico ja foi adicionado para este fornecedor.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const inserted = await gravacoesRelacionamentosApi.addTerceiro(gravacaoId, {
        fornecedorId: selectedFornecedor,
        servicoId: selectedServico,
        valor: custoNum,
      });

      setTerceiros((current) => [...current, inserted]);
      setSelectedFornecedor('');
      setSelectedServico('');
      setCusto('');

      toast({
        title: 'Terceiro adicionado',
        description: `${fornecedor.nome} - ${servico.nome} foi adicionado.`,
      });
    } catch (error) {
      console.error('Error adding terceiro from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao adicionar terceiro: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await gravacoesRelacionamentosApi.removeTerceiro(gravacaoId, id);
      setTerceiros((current) => current.filter((item) => item.id !== id));
      toast({
        title: 'Terceiro removido',
        description: 'O servico terceirizado foi removido.',
      });
    } catch (error) {
      console.error('Error removing terceiro from backend:', error);
      toast({
        title: 'Erro',
        description: `Erro ao remover terceiro: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const totalCusto = useMemo(
    () => terceiros.reduce((acc, item) => acc + item.custo, 0),
    [terceiros],
  );

  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Adicionar Servico Terceirizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select
                value={selectedFornecedor}
                onValueChange={(value) => {
                  setSelectedFornecedor(value);
                  setSelectedServico('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Servico</Label>
              <Select
                value={selectedServico}
                onValueChange={setSelectedServico}
                disabled={!selectedFornecedor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o servico..." />
                </SelectTrigger>
                <SelectContent>
                  {servicosFornecedor.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nome}
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
              onClick={() => void handleAdd()}
              className="gradient-primary hover:opacity-90"
              disabled={!selectedFornecedor || !selectedServico}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {terceiros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum terceiro adicionado</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Adicione fornecedores e servicos terceirizados para esta gravacao.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Servicos Terceirizados
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
                  <TableHead>Servico</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terceiros.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.fornecedorNome}</TableCell>
                    <TableCell>{item.servicoNome}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.custo)}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => void handleRemove(item.id)}
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
                    {terceiros.length} servico(s) contratado(s)
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
