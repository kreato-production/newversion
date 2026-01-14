import { useState, useEffect, useMemo } from 'react';
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

interface Fornecedor {
  id: string;
  nome: string;
  categoria?: string;
  servicos?: string[];
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const TerceirosTab = ({ gravacaoId }: TerceirosTabProps) => {
  const { toast } = useToast();
  const [terceiros, setTerceiros] = useState<TerceiroAlocado[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  
  const [selectedFornecedor, setSelectedFornecedor] = useState('');
  const [selectedServico, setSelectedServico] = useState('');
  const [custo, setCusto] = useState('');

  const storageKey = `kreato_gravacao_terceiros_${gravacaoId}`;

  useEffect(() => {
    // Carregar terceiros alocados
    const storedTerceiros = localStorage.getItem(storageKey);
    if (storedTerceiros) {
      setTerceiros(JSON.parse(storedTerceiros));
    }

    // Carregar fornecedores
    const storedFornecedores = localStorage.getItem('kreato_fornecedores');
    if (storedFornecedores) {
      setFornecedores(JSON.parse(storedFornecedores));
    }

    // Carregar serviços
    const storedServicos = localStorage.getItem('kreato_servicos');
    if (storedServicos) {
      setServicos(JSON.parse(storedServicos));
    }
  }, [gravacaoId, storageKey]);

  const servicosFornecedor = useMemo(() => {
    if (!selectedFornecedor) return [];
    
    const fornecedor = fornecedores.find(f => f.id === selectedFornecedor);
    if (!fornecedor?.servicos || fornecedor.servicos.length === 0) {
      return servicos;
    }
    
    return servicos.filter(s => fornecedor.servicos?.includes(s.id));
  }, [selectedFornecedor, fornecedores, servicos]);

  const saveToStorage = (data: TerceiroAlocado[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setTerceiros(data);
  };

  const handleAdd = () => {
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
    const servico = servicos.find(s => s.id === selectedServico);

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

    const novo: TerceiroAlocado = {
      id: crypto.randomUUID(),
      fornecedorId: selectedFornecedor,
      fornecedorNome: fornecedor.nome,
      servicoId: selectedServico,
      servicoNome: servico.nome,
      custo: custoNum,
    };

    saveToStorage([...terceiros, novo]);

    // Limpar campos
    setSelectedFornecedor('');
    setSelectedServico('');
    setCusto('');

    toast({
      title: 'Terceiro adicionado',
      description: `${fornecedor.nome} - ${servico.nome} foi adicionado.`,
    });
  };

  const handleRemove = (id: string) => {
    const updated = terceiros.filter(t => t.id !== id);
    saveToStorage(updated);
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
              <Label>Custo (R$)</Label>
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
